define(function(require) {

	var Node = require('node');

	class Deref extends Node {

		constructor(hasPname, pname) {
			super(null, "d", "mediumpurple1"); 
			this.hasPname = hasPname;
			this.updatePName(pname);
		}

		transition(token, link) {
			if (link.to == this.key) 
				return this.findLinksOutOf(null)[0]; 
			else if (link.from == this.key) 
				return this.findLinksInto(null)[0]; 				
		}

		copy() {
			return new Deref(this.hasPname, this.pname);
		}

		updatePName(pname) {
			if (this.hasPname) {
				this.pname = pname;
				this.text = "d("+pname+")";
			}
		}

	}
	return Deref;
});