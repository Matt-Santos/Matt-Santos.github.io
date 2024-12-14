
const themes = ['default','black-theme','red-theme','green-theme','blue-theme'];
var themeIndex = sessionStorage.getItem('theme'); 
if (!themeIndex){
	const userPreferedTheme = () => window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches ? 1 : 0;
	themeIndex = userPreferedTheme();
	sessionStorage.setItem('theme', themeIndex);
}
themeIndex = themeIndex - 1 % themes.length;
changeTheme();
function changeTheme() {
	var divs = document.querySelectorAll('body, .w3-content, .w3-col');	
	for (var i = 0; i < divs.length; i++) {
		divs[i].classList.remove(themes[themeIndex]);
		divs[i].classList.add(themes[(themeIndex+1) % themes.length]);
	}
	themeIndex = (themeIndex + 1) % themes.length;
	sessionStorage.setItem('theme', themeIndex);
}