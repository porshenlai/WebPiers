(function(Return){

	function Tab (e,c) {
		var self=this;
		self.C=c;
		self.E=e;
		e.style.display="none";
		e.addEventListener("transitionend", function () {
			if (e.style.top === "-100%")
				e.style.display="none";
		});
	}
	Tab.prototype.prepare=function () {
		var self=this,
			src=self.E.getAttribute("src");
		self.E.removeAttribute( "src" );
		return src ? new Promise(function (or, oe) {
			function lp(dom) {
				dom=dom.querySelector("body").cloneNode(true);
				self.src=src;
				while (self.E.firstChild)
					self.E.removeChild(self.E.firstChild);
				while (dom.firstChild)
					self.E.appendChild(dom.firstChild);
				Piers.DOM.selectAll(self.E, "script")
				.forEach(function(e){
					Piers.DOM.evalScript(e);
				});
				or();
			}
			Piers.U.create(src).get()
			.then(lp, function () {
				lp(
					(new DOMParser()).parseFromString(
						"<!DocType:html><html><body>Not found</body></html>",
						"text/html"
					)
				);
			});
		}) : new Promise(function (or, oe) { or(); }, Piers.nf);
	};
	Tab.prototype.release=function () {
		var self = this;
		if( self.src ){
			self.E.setAttribute("src", self.src);
			while (self.E.firstChild)
				self.E.removeChild(self.E.firstChild);
		}
	};
	Tab.prototype.hide=function () {
		this.E.style.top = "-100%";
	};
	Tab.prototype.show=function () {
		var self=this,e,u;

		for( e in self.C )
			(self.C[e].hide||Piers.nf)();

		self.prepare().then(Piers.nf, Piers.xf);
		self.E.style.display = "block";
		setTimeout(function () {
			self.E.style.top="0";
		}, 10);
	};
	Tab.prototype.sendEvent=function (name, args) {
		var self=this;
		return Piers.DOM.sendEvent(
			self.E, name,
			{ "detail": Object.assign({
				Tab:self,
			}, args||{}) }
		);
	};

	Return.setResult(Tab);

})(Piers.__LIBS__.Tab);
