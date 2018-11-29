if (window.location.hostname === '{host}'){
	const port = '4201';
	var livereload = document.createElement('script');
	livereload.setAttribute('src','http://127.0.0.1:' + port + '/livereload.js');
	document.head.appendChild(livereload);
}
