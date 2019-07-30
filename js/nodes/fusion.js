define(function(require) {

	var Node = require('node');
	var CompData = require('token').CompData();
	var RewriteFlag = require('token').RewriteFlag();
	var Link = require('link');
	var Promo = require('nodes/promo');
	var Const = require('nodes/const');
	var Projection = require('nodes/proj');
	var Contract = require('nodes/contract');
	var Param = require('nodes/param');
	var ProvCon = require('nodes/pc');
	var Cell = require('nodes/cell');
	var Pair = require('token').Pair();

	class Fuse extends Node {

		constructor() {
			super(null, "f","indianred1");
		}
		
		transition(token, link) { 
			if (link.to == this.key) {
				var nextLink = this.findLinksOutOf("n")[0];
				token.dataStack.push(CompData.PROMPT);
				return nextLink; 
			}
			else if (link.from == this.key) {
				token.dataStack.pop();
				token.rewriteFlag = RewriteFlag.F_FUSE;
				var nextLink = this.findLinksInto("s")[0];
				return nextLink;
			}
		}

		rewrite(token, nextLink) {
			if (token.rewriteFlag == RewriteFlag.F_FUSE && nextLink.to == this.key) {
				token.rewriteFlag = RewriteFlag.EMPTY;

				nextLink = this.aux(this);
					
				token.rewrite = true;
				return nextLink;
			}
			
			else if (token.rewriteFlag == RewriteFlag.EMPTY) {
				token.rewrite = false;
				return nextLink;
			}
		}

		aux(node) {
			var nodes = [node];
			var visitedCell = []; 
			var target = []; 
			while (nodes.length != 0) {
				var node = nodes.pop();

				if (node instanceof ProvCon) { 
					if (target.indexOf(node.key) == -1) 
						target.push(node.key);
				}
				else if (node instanceof Projection) { 
					if (target.indexOf(node.key) == -1) 
						target.push(node.key); 
				}
				else if (node instanceof Promo) {
					nodes = nodes.concat(node.group.auxs);
				}
				else if (node instanceof Cell) {
					if (visitedCell.indexOf(node.key) == -1) {
						nodes.push(this.graph.findNodeByKey(node.findLinksOutOf(null)[0].to));
						visitedCell.push(node.key);
					}
				}
				else {
					var newNodes = [];
					var links = node.findLinksOutOf(null);
					links.forEach(function(link) {
						newNodes.push(node.graph.findNodeByKey(link.to));
					});
					nodes = nodes.concat(newNodes);
				}
			}

			var index = 0;
			var vec = new Param().addToGroup(this.group);
			var con = new Contract().addToGroup(this.group);
			new Link(con.key, vec.key, "n", "s").addToGroup(this.group);
			target.forEach(function(key) {
				var node = vec.graph.findNodeByKey(key);
				var proj = new Projection(index).addToGroup(vec.group);
				new Link(proj.key, con.key, "n", "s").addToGroup(vec.group);
				node.findLinksInto(null)[0].changeTo(proj.key,"s");
				index++;
				if (node instanceof ProvCon) {
					var c = new Const(node.data).addToGroup(vec.group);
					new Link(vec.key, c.key, "n", "s").addToGroup(vec.group);					
					node.delete();
				}
				else if (node instanceof Projection) {
					new Link(vec.key, node.key, "n", "s").addToGroup(vec.group);
				}
			});

			var nextLink = this.findLinksInto(null)[0];
			nextLink.changeTo(con.key,"s");

			var weak = new Contract().addToGroup(this.group);
			this.findLinksOutOf(null)[0].changeFrom(weak.key,"n");
			this.delete()
			return nextLink;
		}

		copy() {
			return new Fuse();
		}
	}

	return Fuse;
});