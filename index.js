const songData = JSON.parse(DataBase.getDataBase('ArcaeaSongInfo.txt')).songs;

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {
  if(msg.indexOf('/world ') == 0) {
    cmd = msg.substr(7).split(' ');
    let noti = '\n/world (전진하려는 스텝 범위) (파트너 STEP)';
    if(cmd.length != 3) {
      replier.reply('3개만 입력' + noti);
      return;
    }
    let bool = [cmd[0], cmd[1], cmd[2]].map(x=>Number(x)).some(x=>isNaN(x));
    if(bool) {
      replier.reply('숫자만 입력' + noti);
      return;
    }
    let res = worldCalc(cmd[0], cmd[1], cmd[2]);
    let failed = 2.5 * (cmd[2] / 50);
    failed = Math.floor(failed * 10) / 10;
    if(res[0] != 'impossible') {
      const allSee = '\u200b'.repeat(500) + '\n\n';
      res = res.length + '개의 결과' + allSee + res.join('\n') + '\n\n클리어 기준입니다';
      res += '\n하드게이지 폭사 시: ' + failed;
    }
    else {
      if(cmd[0] <= failed && failed <= cmd[1]) {
        replier.reply('폭사하세요\n하드게이지 폭사 시: ' + failed);
        return;
      }
      res = res[0];
    }
    replier.reply(res);
  }
  if(msg == '/con') {
    let data = sortSongsByConstant();
    let keys = Object.keys(data);
    let res = '';
    for(let i in keys) {
      if(i != 0) res += '\n--------\n';
      res += '(' + Number(keys[i]).toFixed(1) + ')\n';
      res += data[keys[i]].join('\n');
    }
    res = '곡 상수' + '\u200b'.repeat(496) + '\n\n' + res;
    replier.reply(res);
  }
}

function getConstant() {
  let arr = [];
  for(let i in songData) {
    songData[i].difficulties.map(x => {
      if(x.ratingReal!=-1)
        arr.push(x.ratingReal);
    });
  }
  arr = arr.sort((a,b) => a - b);
  arr = Array.from(new Set(arr));
  return arr;
}

function sortSongsByConstant() {
  let json = {};
  let constant = getConstant();
  for(let i in constant) json[constant[i]] = [];
  let diff = ['PST', 'PRS', 'FTR', 'BYD'];
  for(let i in songData) {
    let info = songData[i];
    let title = info.title_localized.en;
    info.difficulties.map(x => {
      if(x.ratingReal > 0)
        json[x.ratingReal].push(
          '[' + diff[x.ratingClass] + ' ' 
          + x.rating.toString().replace('.5', '+') + '] '
          + title
        );
    });
  }
  return json;
}

function worldCalc(min, max, step) {
  let arr = [];
  let constant = getConstant();
  let chartPTTMax = Math.pow((((max * (50 / step)) - 2.5) / 2.45), 2);
  let chartPTTMin = Math.pow((((min * (50 / step)) - 2.5) / 2.45), 2);
  if((((max * (50 / step)) - 2.5) / 2.45) < 0)
    return ['impossible'];
  if((((min * (50 / step)) - 2.5) / 2.45) < 0)
    chartPTTMin = -31;
  for(let j in constant) {
    let i = constant[j];
    let str = '';
    let scoreMin = getScore(i, chartPTTMin).toFixed(0) * 1;
    let scoreMax = getScore(i, chartPTTMax).toFixed(0) * 1;
    if(scoreMin == scoreMax && scoreMin >= 0) {
      arr.push('(' + i.toFixed(1) + ') ' + scoreMax);
      continue;
    }
    if(scoreMin >= 0) 
      str += scoreMin;
    else if(scoreMax == -1 && scoreMin == -1)
      continue;
    else str += 0;
    str += ' ~ ';
    if(scoreMax == 10000000 || scoreMax < 0)
      str += '';
    else if(scoreMax >= 0)
      str += scoreMax;
    if(str != ' ~ ') {
      str = '(' + i.toFixed(1) + ') ' + str;
      arr.push(str);
    }
  }
  if(arr.length == 0)
    arr = ['impossible'];
  return arr;
}

function getScore(detailRating, chartPTT) {
  let mod = chartPTT - detailRating;
  if(mod < -30) return -2;
  if(mod > 2) return -1;
  if(mod == 2) return 10000000;
  else if(mod >= 1.0)
    return ((mod - 1.0) * 200000) + 9800000;
  //else if(mod >= 1.0)
  //  return ((mod - 1.0) * 300000) + 9500000;
  return (mod * 300000) + 9500000;
}