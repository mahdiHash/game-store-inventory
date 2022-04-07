let uploadedImg;

document.getElementById('imgInp').addEventListener('change', function () {
	let reader = new FileReader();
	reader.readAsDataURL(this.files[0]);
	reader.addEventListener('load', () => {
		console.log(' i am reader event listener');
		uploadedImg = reader.result;
		document.getElementById('imgOutput').style.backgroundImage 
			= `url(${uploadedImg})`;
	});	
});
