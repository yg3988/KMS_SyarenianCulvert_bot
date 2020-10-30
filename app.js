//https://discord.com/api/oauth2/authorize?client_id=769894272954269746&permissions=219285568&scope=bot

//node_modules
const Discord = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

//discord bot token
const { __token } = require('./token.js');

//moongoose
const DB = require('./db');
const Guild = require('./model/guild-model');
const Member = require('./model/member-model');

//extra module
const AssignParty = require('./assign-party');
const Client = new Discord.Client();

let GuildID;

let maskMembers = new Object();

Client.on('ready', () => {
	console.log(`${Client.user.tag} ready!`);
	DB.on('error', console.error.bind(console, 'MongoDB connection error : '));
});

Client.on('guildCreate', (guild) => {
	//서버에 봇이 초대될 때, DB생성
	new Guild({ gid: guild.id })
		.save()
		.then(Object.assign(maskMembers, { [guild.id]: new Object() }));
});

Client.on('message', (msg) => {
	const contents = msg.content.split(' ');
	const command = contents[0];

	//condition flag
	//0 test mode
	//1 participate
	//2 exit
	const cond =
		command === ';p' || command === ';참가'
			? 1
			: command === ';e' || command === ';철회'
			? 2
			: command === ';s' || command === ';a' || command === ';배정'
			? 3
			: command === ';c' || command === ';초기화'
			? 4
			: 0;

	if (!cond) {
		if (msg.content === ';test') {
			console.log(maskMembers);
		}
	} else {
		let nickname;

		if (contents.length === 2) nickname = contents[1];
		else if (contents.length === 1) {
			if (cond === 1 || cond === 2) {
				//메이플 닉네임 = 디스코드 닉네임
				const guild = Client.guilds.cache.get(GuildID);
				const GuildMember = guild.member(msg.author);

				const splitedNickname = GuildMember.displayName.split('/');

				nickname = splitedNickname[0];
			}
		} else {
			return msg.reply(`잘못된 명령어 사용입니다. ;help`);
		}

		if (cond === 1) {
			//샤레니안 참가 신청
			//참가 커맨드 ;p, ;참가
			if (maskMembers[nickname]) return msg.reply('참가 완료된 캐릭터입니다.');

			const encodedCharacter = encodeURI(nickname);
			const URL = 'https://maple.gg/u/' + encodedCharacter;

			const getUserInfo = async (URL) => {
				return Promise.resolve(
					axios.get(URL).then((res, rej) => {
						const $ = cheerio.load(res.data);

						//메이플 캐릭터 정보
						//first : 캐릭터이름, 직업, 레벨
						//second : 무릉 층 수
						const first = $('div.user-profile').find(
							'section.container>div.row>div:nth-child(2)'
						)[0];
						const second = $(
							'div.card>div>section.container>div.text-center>div'
						).find('h1');

						let stage;

						//무릉 층수 정보가 없을 경우 0층으로 표기
						second.length
							? (stage = second[0].children[0].data.split('\n')[0])
							: (stage = 0);

						return {
							nickname: first.children[1].children[3].children[0].data,
							job: first.children[3].children[1].children[3].children[0].data,
							lv: first.children[3].children[1].children[1].children[0].data.split(
								'.'
							)[1],
							stage: stage,
						};
					})
				);
			};

			getUserInfo(URL).then(async (res, rej) => {
				const GuildID = Client.guilds.resolveID(msg.guild.id);

				const member = new Member(res);
				member.save();

				const guild = await Guild.findOne({ gid: GuildID });
				guild.members.push(member);

				guild.save();
				Object.assign(maskMembers[GuildID], { [nickname]: true });
				msg.reply(`참가신청되었습니다.`);
			});
		} else if (cond === 2) {
			//샤레니안 참가 취소
			//취소 커맨드 ;e ;철회
			const GuildID = Client.guilds.resolveID(msg.guild.id);
			delete maskMembers[nickname];

			Member.findOneAndDelete({ nickname: nickname }, async (err, res) => {
				Guild.findOneAndUpdate(
					{ gid: GuildID },
					{ $pull: { members: res._id } }
				);
			});
			msg.reply('참가 철회되셨습니다.');
		} else if (cond === 3) {
			//샤레니안 파티 배정
			//배정 커맨드 ;s, ;a ;파티배정
			const GuildID = Client.guilds.resolveID(msg.guild.id);

			Guild.findOne({ gid: GuildID })
				.populate({ path: 'members', options: { sort: 'stage' } })
				.exec((err, res) => {
					const syarenian = AssignParty(res.toObject().members);

					syarenian.then((res, rej) => {
						const length = res.length;

						for (let i = 0; i < length; i++) {
							const embed = new Discord.MessageEmbed()
								.setTitle(`${i + 1}수로`)
								.setColor(0xff0000).setDescription(`
								\`\`\`
| 1파티 | 2파티 | 3파티 |
|---|---|---|
| ${res[i][0][0] ? res[i][0][0].nickname : null}  | ${
								res[i][1][0] ? res[i][1][0].nickname : null
							}  | ${res[i][2][0] ? res[i][2][0].nickname : null}  |
| ${res[i][0][1] ? res[i][0][1].nickname : null}  | ${
								res[i][1][1] ? res[i][1][1].nickname : null
							}  | ${res[i][2][1] ? res[i][2][1].nickname : null}  |
| ${res[i][0][2] ? res[i][0][2].nickname : null}  | ${
								res[i][1][2] ? res[i][1][2].nickname : null
							}  | ${res[i][2][2] ? res[i][2][2].nickname : null}  |
| ${res[i][0][3] ? res[i][0][3].nickname : null}  | ${
								res[i][1][3] ? res[i][1][3].nickname : null
							}  | ${res[i][2][3] ? res[i][2][3].nickname : null}  |
| ${res[i][0][4] ? res[i][0][4].nickname : null}  | ${
								res[i][1][4] ? res[i][1][4].nickname : null
							}  | ${res[i][2][4] ? res[i][2][4].nickname : null}  |
| ${res[i][0][5] ? res[i][0][5].nickname : null}  | ${
								res[i][1][5] ? res[i][1][5].nickname : null
							}  | ${res[i][2][5] ? res[i][2][5].nickname : null}  |
								\`\`\`
								`);
							msg.channel.send(embed);
						}
					});
				});
		} else if (cond === 4) {
			//샤레니안 멤버초기화
			//배정 커맨드 ;c ;초기화
			const GuildID = Client.guilds.resolveID(msg.guild.id);
			Object.assign(maskMembers, { [GuildID]: new Object() });
			Guild.findOne({ gid: GuildID })
				.populate('members')
				.exec(async (err, res) => {
					const length = res.toJSON().members.length;
					for (let i = 0; i < length; i++) {
						await Guild.findOneAndUpdate(
							{ gid: GuildID },
							{ $pull: { members: res.members[i]._id } }
						);
						await Member.findByIdAndDelete(res.members[i]._id);
					}
				});

			// new Guild({ gid: GuildID })
			// 	.save()
			// 	.then(Object.assign(maskMembers, { [GuildID]: new Object() }));
		}
	}
});

Client.login(__token);
// console.log(res);
// 					const members = res.toJSON().members;
// 					const length = members.length;
// 					for (let i = 0; i < length; i++) {
// 						Guild.findOneAndUpdate(
// 							{ gid: GuildID },
// 							{ $pull: { members: res.members[i]._id } }
// 						).exec();
// 						Member.deleteOne({ _id: res.members[i]._id });
