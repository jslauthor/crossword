#!/usr/bin/env node

import { program } from 'commander';

program.parse(process.argv);

function isValidEmojiList(unicodes) {
  const validEmojis =
    '🀄🃏🆎🆑🆒🆓🆔🆕🆖🆗🆘🆙🆚🈁🈂🈚🈯🈲🈳🈴🈵🈶🈷🈸🈹🈺🉐🉑🌀🌁🌂🌃🌄🌅🌆🌇🌈🌉🌊🌋🌌🌍🌎🌏🌐🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌞🌟🌠🌡🌤🌥🌦🌧🌨🌩🌪🌫🌬🌭🌮🌯🌰🌱🌲🌳🌴🌵🌶🌷🌸🌹🌺🌻🌼🌽🌾🌿🍀🍁🍂🍃🍄🍅🍆🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍔🍕🍖🍗🍘🍙🍚🍛🍜🍝🍞🍟🍠🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮🍯🍰🍱🍲🍳🍴🍵🍶🍷🍸🍹🍺🍻🍼🍽🍾🍿🎀🎁🎂🎃🎄🎅🎆🎇🎈🎉🎊🎋🎌🎍🎎🎏🎐🎑🎒🎓🎖🎗🎙🎚🎛🎞🎟🎠🎡🎢🎣🎤🎥🎦🎧🎨🎩🎪🎫🎬🎭🎮🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋🏌🏍🏎🏏🏐🏑🏒🏓🏔🏕🏖🏗🏘🏙🏚🏛🏜🏝🏞🏟🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏳🏴🏵🏷🏸🏹🐀🐁🐂🐃🐄🐅🐆🐇🐈🐉🐊🐋🐌🐍🐎🐏🐐🐑🐒🐓🐔🐕🐖🐗🐘🐙🐚🐛🐜🐝🐞🐟🐠🐡🐢🐣🐤🐥🐦🐧🐨🐩🐪🐫🐬🐭🐮🐯🐰🐱🐲🐳🐴🐵🐶🐷🐸🐹🐺🐻🐼🐽🐾🐿👀👁👂👃👄👅👆👇👈👉👊👋👌👍👎👏👐👑👒👓👔👕👖👗👘👙👚👛👜👝👞👟👠👡👢👣👤👥👦👧👨👩👪👫👬👭👮👯👰👱👲👳👴👵👶👷👸👹👺👻👼👽👾👿💀💁💂💃💄💅💆💇💈💉💊💋💌💍💎💏💐💑💒💓💔💕💖💗💘💙💚💛💜💝💞💟💠💡💢💣💤💥💦💧💨💩💪💫💬💭💮💯💰💱💲💳💴💵💶💷💸💹💺💻💼💽💾💿📀📁📂📃📄📅📆📇📈📉📊📋📌📍📎📏📐📑📒📓📔📕📖📗📘📙📚📛📜📝📞📟📠📡📢📣📤📥📦📧📨📩📪📫📬📭📮📯📰📱📲📳📴📵📶📷📸📹📺📻📼📽📿🔀🔁🔂🔃🔄🔅🔆🔇🔈🔉🔊🔋🔌🔍🔎🔏🔐🔑🔒🔓🔔🔕🔖🔗🔘🔙🔚🔛🔜🔝🔞🔟🔠🔡🔢🔣🔤🔥🔦🔧🔨🔩🔪🔫🔬🔭🔮🔯🔰🔱🔲🔳🔴🔵🔶🔷🔸🔹🔺🔻🔼🔽🕉🕊🕋🕌🕍🕎🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧🕯🕰🕳🕴🕵🕶🕷🕸🕹🕺🖇🖊🖋🖌🖍🖐🖕🖖🖤🖥🖨🖱🖲🖼🗂🗃🗄🗑🗒🗓🗜🗝🗞🗡🗣🗨🗯🗳🗺🗻🗼🗽🗾🗿😀😁😂😃😄😅😆😇😈😉😊😋😌😍😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟😠😡😢😣😤😥😦😧😨😩😪😫😬😭😮😯😰😱😲😳😴😵😶😷😸😹😺😻😼😽😾😿🙀🙁🙂🙃🙄🙅🙆🙇🙈🙉🙊🙋🙌🙍🙎🙏🚀🚁🚂🚃🚄🚅🚆🚇🚈🚉🚊🚋🚌🚍🚎🚏🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🚚🚛🚜🚝🚞🚟🚠🚡🚢🚣🚤🚥🚦🚧🚨🚩🚪🚫🚬🚭🚮🚯🚰🚱🚲🚳🚴🚵🚶🚷🚸🚹🚺🚻🚼🚽🚾🚿🛀🛁🛂🛃🛄🛅🛋🛌🛍🛎🛏🛐🛑🛒🛕🛖🛗🛜🛝🛞🛟🛠🛡🛢🛣🛤🛥🛩🛫🛬🛰🛳🛴🛵🛶🛷🛸🛹🛺🛻🛼🟠🟡🟢🟣🟤🟥🟦🟧🟨🟩🟪🟫🟰🤌🤍🤎🤏🤐🤑🤒🤓🤔🤕🤖🤗🤘🤙🤚🤛🤜🤝🤞🤟🤠🤡🤢🤣🤤🤥🤦🤧🤨🤩🤪🤫🤬🤭🤮🤯🤰🤱🤲🤳🤴🤵🤶🤷🤸🤹🤺🤼🤽🤾🤿🥀🥁🥂🥃🥄🥅🥇🥈🥉🥊🥋🥌🥍🥎🥏🥐🥑🥒🥓🥔🥕🥖🥗🥘🥙🥚🥛🥜🥝🥞🥟🥠🥡🥢🥣🥤🥥🥦🥧🥨🥩🥪🥫🥬🥭🥮🥯🥰🥱🥲🥳🥴🥵🥶🥷🥸🥹🥺🥻🥼🥽🥾🥿🦀🦁🦂🦃🦄🦅🦆🦇🦈🦉🦊🦋🦌🦍🦎🦏🦐🦑🦒🦓🦔🦕🦖🦗🦘🦙🦚🦛🦜🦝🦞🦟🦠🦡🦢🦣🦤🦥🦦🦧🦨🦩🦪🦫🦬🦭🦮🦯🦰🦱🦲🦳🦴🦵🦶🦷🦸🦹🦺🦻🦼🦽🦾🦿🧀🧁🧂🧃🧄🧅🧆🧇🧈🧉🧊🧋🧌🧍🧎🧏🧐🧑🧒🧓🧔🧕🧖🧗🧘🧙🧚🧛🧜🧝🧞🧟🧠🧡🧢🧣🧤🧥🧦🧧🧨🧩🧪🧫🧬🧭🧮🧯🧰🧱🧲🧳🧴🧵🧶🧷🧸🧹🧺🧻🧼🧽🧾🧿🩰🩱🩲🩳🩴🩵🩶🩷🩸🩹🩺🩻🩼🪀🪁🪂🪃🪄🪅🪆🪇🪈🪐🪑🪒🪓🪔🪕🪖🪗🪘🪙🪚🪛🪜🪝🪞🪟🪠🪡🪢🪣🪤🪥🪦🪧🪨🪩🪪🪫🪬🪭🪮🪯🪰🪱🪲🪳🪴🪵🪶🪷🪸🪹🪺🪻🪼🪽🪿🫀🫁🫂🫃🫄🫅🫎🫏🫐🫑🫒🫓🫔🫕🫖🫗🫘🫙🫚🫛🫠🫡🫢🫣🫤🫥🫦🫧🫨🫰🫱🫲🫳🫴🫵🫶🫷🫸‼⌚⌛⌨⏏⏩⏪⏫⏬⏭⏮⏯⏰⏱⏲⏳⏸⏹⏺▶◀☀☁☂☃☄☎☑☔☕☘☝☠☢☣☦☪☮☯☸☹☺♀♂♈♉♊♋♌♍♎♏♐♑♒♓♟♠♣♥♦♨♻♾♿⚒⚓⚔⚕⚖⚗⚙⚛⚜⚠⚡⚧⚪⚫⚰⚱⚽⚾⛄⛅⛈⛎⛏⛑⛓⛔⛩⛪⛰⛱⛲⛳⛴⛵⛷⛸⛹⛺⛽✂✅✈✉✊✋✌✍✏✒✔✖✝✡✨✳✴❄❇❌❎❓❔❕❗❣❤➕➖➗➡⤴⤵⬅⬆⬇⭐⭕🇺🇸🇨🇳🇯🇵🇩🇪🇬🇧🇫🇷🇮🇳🇮🇹🇨🇦🇦🇺🇧🇷🇷🇺🇰🇷🇪🇸🇲🇽🇳🇱🇨🇭🇸🇪🇸🇬🇦🇪🇧🇪🇳🇴🇩🇰🇦🇹🇫🇮🇳🇿🇵🇱🇮🇪🇮🇱🇹🇷🇸🇦🇿🇦🇵🇹🇬🇷🇨🇿🇭🇺🇹🇭🇻🇳🇵🇭🇲🇾🇮🇩🇦🇷🇨🇱🇪🇬🇵🇰🇳🇬🇧🇩🇺🇦';

  let isValid = true;

  if (unicodes.length !== 26) {
    console.log('length');
    isValid = false;
  }

  const uniqueSet = new Set(unicodes);
  if (unicodes.length !== uniqueSet.size) {
    console.log('size');
    isValid = false;
  }

  for (const unicodeString of unicodes) {
    try {
      // Function to convert Unicode string to emoji
      function unicodeToEmoji(unicode) {
        return String.fromCodePoint(
          ...unicode.split('_').map((u) => parseInt(u, 16)),
        );
      }

      // Check if the input string is in the correct format
      const unicodeParts = unicodeString.split('_');
      if (
        unicodeParts.length > 2 ||
        (unicodeParts.length === 2 && unicodeParts[1].startsWith('u'))
      ) {
        isValid = false;
      }

      // Remove the 'u' prefix from the first part
      const normalizedUnicodeString =
        unicodeParts[0].replace(/^u/, '') +
        (unicodeParts.length === 2 ? '_' + unicodeParts[1] : '');

      // Convert the normalized Unicode string to an emoji
      const emoji = unicodeToEmoji(normalizedUnicodeString);

      // Check if the emoji is in the list of valid emojis
      if (!validEmojis.includes(emoji)) {
        console.log(emoji);
        isValid = false;
      }
    } catch (e) {
      // console.log(unicodeString, e);
      isValid = false;
    }
  }

  return isValid;
}

async function main() {
  console.log(
    isValidEmojiList([
      'u1f3f0',
      'u1f5fd',
      'u1f1e8_u1f1f3',
      'u1f5fc',
      'u1f3db',
      'u1f1ef_u1f1f5',
      'u1f5fb',
      'u1f1ec_u1f1e7',
      'u1f1eb_u1f1f7',
      'u1f1ee_u1f1f3',
      'u1f1ee_u1f1f9',
      'u1f1e8_u1f1e6',
      'u1f3ef',
      'u1f1e6_u1f1fa',
      'u1f1e7_u1f1f7',
      'u1f1f7_u1f1fa',
      'u1f1ea_u1f1f8',
      'u1f1f2_u1f1fd',
      'u1f1f3_u1f1f1',
      'u1f1e8_u1f1ed',
      'u1f1f8_u1f1ea',
      'u1f1f8_u1f1ec',
      'u1f1e6_u1f1ea',
      'u1f1e7_u1f1ea',
      'u1f1f3_u1f1f4',
      'u1f1e9_u1f1f0',
    ]),
  );
}

main();
