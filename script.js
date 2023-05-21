let isErrorGlobal = false;
let time = 0;
const URL_API = "https://subtitle-chat-gtp-manage-server.vercel.app";

const listUser = [
	{
		username: "phuchoa1202@gmail.com",
		password: "12345678"
	},
	{
		username: "phuchoa1202chat1@gmail.com",
		password: "12345678"
	},
	{
		username: "phuchoa1202chat2@gmail.com",
		password: "12345678"
	},
	{
		username: "phuchoa1202chat3@gmail.com",
		password: "12345678"
	},
	{
		username: "phuchoa1202chat4@gmail.com",
		password: "12345678"
	},
]

function addHtmlToBody(html) {
	var newDiv = document.createElement('div');
	newDiv.className = "modal-extensions"
	newDiv.innerHTML = html;
	document.body.appendChild(newDiv);
}
const getPosition = (element) => {
	var rect = element.getBoundingClientRect();
	var x = rect.x + (rect.width / 2);
	var y = rect.y + (rect.height / 2);

	return { x, y }
}
const html = `
<button class="login-button">Đăng nhập username nick 1</button>
<button class="login-button">Đăng nhập username nick 2</button>
<button class="login-button">Đăng nhập username nick 3</button>
<button class="login-button">Đăng nhập username nick 4</button>
<button class="login-button">Đăng nhập username nick 5</button>
<button class="start-button">Bắt đầu chạy phụ đề</button>
<button class="stop-button">Dừng chạy phụ đề</button>
<button class="upload-button">Upload Data</button>
`

addHtmlToBody(html);

function click(elemt) {
	const sendIcon = elemt;
	const sendPostion = getPosition(sendIcon);
	const { x, y } = sendPostion;

	var ev = new MouseEvent('click', {
		'view': window,
		'bubbles': true,
		'cancelable': true,
		'screenX': x,
		'screenY': y
	});

	var el = document.elementFromPoint(x, y);
	el.dispatchEvent(ev);
}
function autoClick() {
	const sendIcon = document.querySelector('[placeholder="Send a message."]+button');
	click(sendIcon);
}

function enterText(text , textareaElemt) {
	// Đặt giá trị cho textarea
	textareaElemt.value = text;

	// Kích hoạt sự kiện input trên textarea
	var event = new Event('input', {
		bubbles: true,
		cancelable: true,
	});
	textareaElemt.dispatchEvent(event);
}

const getTextToChat = async () => {
	let textEnd = "";
	const myPromise = new Promise((resolve, reject) => {
		function dq() {
			setTimeout(() => {
				const Group = document.querySelector(".flex.h-full.max-w-full.flex-1.flex-col").querySelectorAll(".group");

				const GroupEnd = Group[Group.length - 1];
				const elemtText = GroupEnd.querySelector(".flex.flex-col.items-start.gap-4.whitespace-pre-wrap.break-words");
				const isWaiting = elemtText.querySelector(".result-streaming") !== null;
				const isError = elemtText.querySelector(".py-2.px-3.border.text-gray-600.rounded-md.text-sm.border-red-500");

				if (isWaiting) {
					dq();
				} else {

					if (isError !== null) {
						isErrorGlobal = true;
						resolve("");
					}

					const text = elemtText.querySelector("p").innerText;
					resolve(text);
				}
			}, 2000);
		}
		dq();
	});

	await myPromise.then((res) => {
		textEnd = res;
	})

	return textEnd;
}

const logOut = () => {
	const avatar = document.querySelector('.w-5.flex-shrink-0');
	click(avatar);
	function dq() {
		setTimeout(() => {
			const elemtMenu = document.querySelector('[role="menu"]');

			if (!elemtMenu) {
				dq();
			} else {
				const elemtItems = elemtMenu.querySelectorAll('[role="menuitem"]');
				const elemtItemLast = elemtItems[elemtItems.length - 1];
				click(elemtItemLast);
			}
		}, 2000);
	}
	dq();
}

const sendChatGPT = async (item) => {
	let resulttext = "";
	const text = `Dịch sang tiếng Việt cho dễ hiểu lập trình viên : "${item.text}"`;
	await enterText(text , document.querySelector('textarea'));
	await autoClick();
	resulttext = await getTextToChat();
	return resulttext;
}

const ApiSuccess = () => {
	fetch(`${URL_API}/subtitle/done`).then(res => {
		alert("Dịch thành công!");
		getTheTranslatedList();
	})
}

const updateData = (data, id, name) => {
	const newObject = {
		name,
		data
	}

	console.log(newObject)
	console.log(JSON.stringify(newObject));

	fetch(`${URL_API}/subtitleoutstanding/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(newObject)
	})
		.then((response) => {
			console.log(`Thời gian tổng cộng : ${time}ms`);
			if (!isErrorGlobal) {
				ApiSuccess();
			} else {
				logOut()
			}
		});
}

const getData = async () => {
	const Res = await fetch(`${URL_API}/subtitleoutstanding`);
	const response = await Res;
	const json = await response.json();
	return json.data[0];
}
const getTheTranslatedList = async () => {
	const elemt = await getData();

	const Arr = elemt.data;
	const id = elemt["_id"];
	const name = elemt.name;

	let arr = [];
	let i = 0;
	for (const param of Arr) {
		console.log(`${i}/${Arr.length}`);
		const startTime = new Date();
		i++;
		if (param.translate) {
			arr = [...arr, param];
			continue;
		}

		const res = await sendChatGPT(param);
		if (isErrorGlobal) {
			break;
		}

		arr = [...arr, {
			...param,
			translate: true,
			text: `En :${param.text} - Vi : ${res}`
		}];
		const endTime = new Date();
		const elapsedTime = endTime - startTime;
		time = time + elapsedTime;
		console.log(`Thời gian thực hiện: ${elapsedTime}ms`);
	}

	const arrSuccess = Arr.map((item, index) => {
		if (arr[index]) {
			return arr[index];
		}
		return item;
	})
	await updateData(arrSuccess, id, name);
}

const stopTranslatedList = () => {
	isErrorGlobal = true;
}

const login =  async(user) => {
	const inputDom = document.querySelector(".input");
  await enterText(user[inputDom.name] , inputDom);
	await click(document.querySelectorAll("[type='submit']")[0]);
}

document.querySelector(".start-button").onclick = function () {
	console.log("Bắt đầu chạy phụ đề!")
	getTheTranslatedList();
}

document.querySelector(".stop-button").onclick = function () {
	console.log("Dừng chạy phụ đề!")
	stopTranslatedList();
}

document.querySelector(".upload-button").onclick = function () {
	console.log("Upload data!")
	updateData();
}
document.querySelectorAll(".login-button").forEach((item, index) => {
	item.onclick = function () {
		login(listUser[index])
	}
})