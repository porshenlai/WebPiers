(function(Return){

Piers.require("Step").then(function (SM) {
	let Dialog=Piers.OBJ.inherit(
		function(tab, init){
			var C=(this.E=tab).parentNode;
			SM.call(this, tab, init);
			C.style.top="-100%";
		}, {
			show:function (did,args={}) {
				var self=this, C=self.E.parentNode;
				return new Promise( function (or, oe) {
					if (C.style.top === "0%") return or();
					(function (e, s) {
						for( let i=0; i<s.length; i++ )
							s[i].style.display= s[i] == e ? "block" : "none";
					}) ( self.E, C.querySelectorAll("[PsDialog]") );
					C.style.top = "0%";
					if(did){
						args["__DialogCB__"] = C.__DialogCB__ = function(result,err){
							if( result ) or(result); else console.log(err);
							C.style.top = "-100%";
							C.__DialogCB__ = undefined;
						};
						self.goto( did, args );
					}
				} );
			},
			hide:function( ){
				var C = this.E.parentNode;
				if( C.__DialogCB__ ) C.__DialogCB__( undefined, "Cancelled" );
				else C.style.top = "-100%";
			}
		}, SM
	);
	Return.setResult(Dialog);
}, Piers.xf);

})(Piers.__LIBS__.Dialog);
