module.exports = async function (members) {
	const totLanes = Math.round(members.length / 18);

	let arr120sUser = new Array();
	let arr200sUser = new Array();
	let syarenian = new Array();
	let arrBuff = {
		flame: new Array(),
		battle: new Array(),
		wild: new Array(),
		mecha: new Array(),
		eunwol: new Array(),
		zero: new Array(),
	};
	let arrBishop = new Array();

	//참가 인원 역할에 따른 분류
	const divideUsers = (user) => {
		//buff
		if (
			user.job === '비숍' ||
			user.job === '플레임위자드' ||
			user.job === '배틀메이지' ||
			user.job === '와일드헌터' ||
			user.job === '메카닉' ||
			user.job === '은월' ||
			user.job === '제로'
		) {
			user.job === '비숍'
				? arrBishop.push(user)
				: user.job === '플레임위자드'
				? arrBuff.flame.push(user)
				: user.job === '배틀메이지'
				? arrBuff.battle.push(user)
				: user.job === '와일드헌터'
				? arrBuff.wild.push(user)
				: user.job === '메카닉'
				? arrBuff.mecha.push(user)
				: user.job === '은월'
				? arrBuff.eunwol.push(user)
				: arrBuff.zero.push(user);
		}
		//120s
		else if (
			user.job !== '팔라딘' &&
			user.job !== '다크나이트' &&
			user.job !== '나이트로드' &&
			user.job !== '섀도어' &&
			user.job !== '듀얼블레이더' &&
			user.job !== '바이퍼' &&
			user.job !== '캡틴' &&
			user.job !== '소울마스터' &&
			user.job !== '미하일' &&
			user.job !== '나이트워커' &&
			user.job !== '제논' &&
			user.job !== '에반' &&
			user.job !== '루미너스' &&
			user.job !== '메르세데스' &&
			user.job !== '팬텀' &&
			user.job !== '아델' &&
			user.job !== '일리움'
		) {
			arr120sUser.push(user);
		}
		//200s
		else {
			arr200sUser.push(user);
		}
	};

	for (let i = 0; i < members.length; i++) {
		//18번 줄
		await divideUsers(members[i]);
	}

	//층 수 평균
	const avgStage = async (users) => {
		let tot = 0;
		let num = 0;

		for (let i = users.length - 1; i >= users.length - 15; i--) {
			if (!users[i]) break;
			tot += users[i].stage;
			num++;
		}

		return parseInt(tot / num);
	};

	//파티 배정
	const makeParty = async (users, avg, is200s) => {
		const isState = new Object();
		const arrSynergy = new Object();
		const buffers = new Array('flame', 'battle', 'wild', 'eunwol', 'zero');
		const lane = new Array();

		//극딜 주기 200초일 때, 메카닉 컨디션 추가
		if (is200s) buffers.push('mecha');

		//평균 무릉 층 수에 따른 버퍼 배정
		const assignBuffer = () => {
			for (let i = 0; i < buffers.length; i++) {
				if (arrBuff[buffers[i]].length) {
					let user = arrBuff[buffers[i]].pop();
					//버퍼 혹은 시너지의 무릉 층 수가 딜러들의 평균 무릉 층 수보다 4단계 낮을 경우,
					//버퍼 혹은 시너지의 파티 할당 취소
					if (user.stage < avg - 4) arrBuff[buffers[i]].push(user);
					//버퍼 혹은 시너지의 무릉 층 수가 딜러들의 평균 무릉 층 수와 비슷할 경우,
					//버퍼 혹은 시너지 할당
					else {
						arrSynergy[buffers[i]] = user;
						isState[buffers[i]] = false;
					}
				}
			}
		};

		//101번 줄
		await assignBuffer();

		//배정할 버퍼 혹은 시너지 중 가장 높은 무릉 층 수 스펙의 캐릭터를 반환
		const maxValueInArrSynergy = () => {
			let maxStage = 0;
			let character;
			for (const [key, value] of Object.entries(arrSynergy)) {
				if (maxStage < value.stage) {
					maxStage = value.stage;
					character = key;
				}
			}
			return character;
		};

		//파티에 배정 받지 못한 버퍼나 시너지들 파티 재배정
		const reassignInLane = async () => {
			//파티원 교체
			const changeMembers = (party) => {
				for (let i = party.length - 1; i > -1; i--) {
					if (!Object.keys(isState).length) break;
					if (
						!(
							party[i].job === '비숍' ||
							party[i].job === '플레임위자드' ||
							party[i].job === '배틀메이지' ||
							party[i].job === '와일드헌터' ||
							party[i].job === '메카닉' ||
							party[i].job === '은월' ||
							party[i].job === '제로'
						)
					) {
						const temp = Object.keys(isState).pop();

						!is200s ? arr120sUser.push(party[i]) : arr200sUser.push(party[i]);
						party[i] = arrSynergy[temp];

						delete isState[temp];
						delete arrSynergy[temp];
					}
				}
				return party;
			};

			for (let i = lane.length - 1; i > -1; i--) {
				const tempArr = lane[i];
				delete lane[i];
				//137번 줄
				const party = await changeMembers(tempArr);
				lane[i] = party;
				if (!Object.keys(isState).length) break;
			}
		};

		for (let i = 0; i < 3; i++) {
			const party = new Array();
			const bishop = arrBishop.pop();
			const isBishop = !bishop ? false : true;
			const end = isBishop ? 5 : 6;

			for (let j = 0; j < end; j++) {
				const user = users.pop();
				if (!user) break;
				//122번 줄
				const synergy = maxValueInArrSynergy();
				if (synergy && user.stage < arrSynergy[synergy].stage) {
					users.push(user);
					party.push(arrSynergy[synergy]);
					delete arrSynergy[synergy];
					delete isState[synergy];
				} else {
					party.push(user);
				}
			}
			if (isBishop) party.push(bishop);
			lane.push(party);
		}

		//135번 줄
		if (Object.keys(isState).length) await reassignInLane();

		syarenian.push(lane);
	};

	for (let i = 0; i < totLanes; i++) {
		//극딜 주기 기준 평균 층수 계산
		//77번 줄
		const sec120 = await avgStage(arr120sUser);
		const sec200 = await avgStage(arr200sUser);

		//평균 층 수 비교 후, 파티 배정
		//91번 줄
		sec120 > sec200
			? await makeParty(arr120sUser, sec120, false)
			: await makeParty(arr200sUser, sec200, true);
	}

	return syarenian;
};
