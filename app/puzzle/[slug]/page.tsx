import { PuzzleType } from 'types/types';
import PuzzlePage from 'components/pages/PuzzlePage';
import { getPuzzleBySlug } from 'lib/utils/reader';
import {
  AtlasType,
  NUMBER_RECORD,
  TEXTURE_RECORD,
  generateTextures,
} from 'lib/utils/textures';
import { queryReadOnly } from 'lib/hygraph';

export type PuzzleProps = {
  puzzle: PuzzleType;
  characterTextureAtlasLookup: AtlasType;
  cellNumberTextureAtlasLookup: AtlasType;
};

interface PuzzlePageProps extends PuzzleProps {
  slug: string;
}

export async function generateStaticParams() {
  const fetchAllCrosscubes = async () => {
    let allCrosscubes: any = [];
    let hasNextPage = true;
    let after = null;

    while (hasNextPage) {
      const result: any = await queryReadOnly<{
        crosscubesConnection: {
          edges: { node: { slug: string } }[];
          pageInfo: { hasNextPage: boolean; endCursor: string };
        };
      }>(
        `
        query Query($after: String) {
          crosscubesConnection(
            orderBy: publishedAt_DESC
            first: 1000
            after: $after
          ) {
            edges {
              node {
                slug
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
        { after },
      );

      const newCrosscubes = result?.crosscubesConnection.edges.map(
        (edge: any) => edge.node,
      );
      allCrosscubes = [...allCrosscubes, ...newCrosscubes];
      hasNextPage = result?.crosscubesConnection.pageInfo.hasNextPage;
      after = result?.crosscubesConnection.pageInfo.endCursor;
    }

    return allCrosscubes;
  };

  const crosscubes = await fetchAllCrosscubes();
  return crosscubes;
}

async function getProps(slug: string): Promise<PuzzlePageProps> {
  // Only generate textures when needed
  if (process.env.GENERATE_TEXTURES === 'true') {
    await generateTextures();
  }

  const puzzle = await getPuzzleBySlug(slug);
  if (puzzle == null) throw new Error('Puzzle not found');
  const characterTextureAtlasLookup = TEXTURE_RECORD;
  const cellNumberTextureAtlasLookup = NUMBER_RECORD;

  if (puzzle.svgSegments != null) {
    const validEmojis =
      '🀄🃏🆎🆑🆒🆓🆔🆕🆖🆗🆘🆙🆚🈁🈂🈚🈯🈲🈳🈴🈵🈶🈷🈸🈹🈺🉐🉑🌀🌁🌂🌃🌄🌅🌆🌇🌈🌉🌊🌋🌌🌍🌎🌏🌐🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌞🌟🌠🌡🌤🌥🌦🌧🌨🌩🌪🌫🌬🌭🌮🌯🌰🌱🌲🌳🌴🌵🌶🌷🌸🌹🌺🌻🌼🌽🌾🌿🍀🍁🍂🍃🍄🍅🍆🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍔🍕🍖🍗🍘🍙🍚🍛🍜🍝🍞🍟🍠🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮🍯🍰🍱🍲🍳🍴🍵🍶🍷🍸🍹🍺🍻🍼🍽🍾🍿🎀🎁🎂🎃🎄🎅🎆🎇🎈🎉🎊🎋🎌🎍🎎🎏🎐🎑🎒🎓🎖🎗🎙🎚🎛🎞🎟🎠🎡🎢🎣🎤🎥🎦🎧🎨🎩🎪🎫🎬🎭🎮🎯🎰🎱🎲🎳🎴🎵🎶🎷🎸🎹🎺🎻🎼🎽🎾🎿🏀🏁🏂🏃🏄🏅🏆🏇🏈🏉🏊🏋🏌🏍🏎🏏🏐🏑🏒🏓🏔🏕🏖🏗🏘🏙🏚🏛🏜🏝🏞🏟🏠🏡🏢🏣🏤🏥🏦🏧🏨🏩🏪🏫🏬🏭🏮🏯🏰🏳🏴🏵🏷🏸🏹🐀🐁🐂🐃🐄🐅🐆🐇🐈🐉🐊🐋🐌🐍🐎🐏🐐🐑🐒🐓🐔🐕🐖🐗🐘🐙🐚🐛🐜🐝🐞🐟🐠🐡🐢🐣🐤🐥🐦🐧🐨🐩🐪🐫🐬🐭🐮🐯🐰🐱🐲🐳🐴🐵🐶🐷🐸🐹🐺🐻🐼🐽🐾🐿👀👁👂👃👄👅👆👇👈👉👊👋👌👍👎👏👐👑👒👓👔👕👖👗👘👙👚👛👜👝👞👟👠👡👢👣👤👥👦👧👨👩👪👫👬👭👮👯👰👱👲👳👴👵👶👷👸👹👺👻👼👽👾👿💀💁💂💃💄💅💆💇💈💉💊💋💌💍💎💏💐💑💒💓💔💕💖💗💘💙💚💛💜💝💞💟💠💡💢💣💤💥💦💧💨💩💪💫💬💭💮💯💰💱💲💳💴💵💶💷💸💹💺💻💼💽💾💿📀📁📂📃📄📅📆📇📈📉📊📋📌📍📎📏📐📑📒📓📔📕📖📗📘📙📚📛📜📝📞📟📠📡📢📣📤📥📦📧📨📩📪📫📬📭📮📯📰📱📲📳📴📵📶📷📸📹📺📻📼📽📿🔀🔁🔂🔃🔄🔅🔆🔇🔈🔉🔊🔋🔌🔍🔎🔏🔐🔑🔒🔓🔔🔕🔖🔗🔘🔙🔚🔛🔜🔝🔞🔟🔠🔡🔢🔣🔤🔥🔦🔧🔨🔩🔪🔫🔬🔭🔮🔯🔰🔱🔲🔳🔴🔵🔶🔷🔸🔹🔺🔻🔼🔽🕉🕊🕋🕌🕍🕎🕐🕑🕒🕓🕔🕕🕖🕗🕘🕙🕚🕛🕜🕝🕞🕟🕠🕡🕢🕣🕤🕥🕦🕧🕯🕰🕳🕴🕵🕶🕷🕸🕹🕺🖇🖊🖋🖌🖍🖐🖕🖖🖤🖥🖨🖱🖲🖼🗂🗃🗄🗑🗒🗓🗜🗝🗞🗡🗣🗨🗯🗳🗺🗻🗼🗽🗾🗿😀😁😂😃😄😅😆😇😈😉😊😋😌😍😎😏😐😑😒😓😔😕😖😗😘😙😚😛😜😝😞😟😠😡😢😣😤😥😦😧😨😩😪😫😬😭😮😯😰😱😲😳😴😵😶😷😸😹😺😻😼😽😾😿🙀🙁🙂🙃🙄🙅🙆🙇🙈🙉🙊🙋🙌🙍🙎🙏🚀🚁🚂🚃🚄🚅🚆🚇🚈🚉🚊🚋🚌🚍🚎🚏🚐🚑🚒🚓🚔🚕🚖🚗🚘🚙🚚🚛🚜🚝🚞🚟🚠🚡🚢🚣🚤🚥🚦🚧🚨🚩🚪🚫🚬🚭🚮🚯🚰🚱🚲🚳🚴🚵🚶🚷🚸🚹🚺🚻🚼🚽🚾🚿🛀🛁🛂🛃🛄🛅🛋🛌🛍🛎🛏🛐🛑🛒🛕🛖🛗🛜🛝🛞🛟🛠🛡🛢🛣🛤🛥🛩🛫🛬🛰🛳🛴🛵🛶🛷🛸🛹🛺🛻🛼🟠🟡🟢🟣🟤🟥🟦🟧🟨🟩🟪🟫🟰🤌🤍🤎🤏🤐🤑🤒🤓🤔🤕🤖🤗🤘🤙🤚🤛🤜🤝🤞🤟🤠🤡🤢🤣🤤🤥🤦🤧🤨🤩🤪🤫🤬🤭🤮🤯🤰🤱🤲🤳🤴🤵🤶🤷🤸🤹🤺🤼🤽🤾🤿🥀🥁🥂🥃🥄🥅🥇🥈🥉🥊🥋🥌🥍🥎🥏🥐🥑🥒🥓🥔🥕🥖🥗🥘🥙🥚🥛🥜🥝🥞🥟🥠🥡🥢🥣🥤🥥🥦🥧🥨🥩🥪🥫🥬🥭🥮🥯🥰🥱🥲🥳🥴🥵🥶🥷🥸🥹🥺🥻🥼🥽🥾🥿🦀🦁🦂🦃🦄🦅🦆🦇🦈🦉🦊🦋🦌🦍🦎🦏🦐🦑🦒🦓🦔🦕🦖🦗🦘🦙🦚🦛🦜🦝🦞🦟🦠🦡🦢🦣🦤🦥🦦🦧🦨🦩🦪🦫🦬🦭🦮🦯🦰🦱🦲🦳🦴🦵🦶🦷🦸🦹🦺🦻🦼🦽🦾🦿🧀🧁🧂🧃🧄🧅🧆🧇🧈🧉🧊🧋🧌🧍🧎🧏🧐🧑🧒🧓🧔🧕🧖🧗🧘🧙🧚🧛🧜🧝🧞🧟🧠🧡🧢🧣🧤🧥🧦🧧🧨🧩🧪🧫🧬🧭🧮🧯🧰🧱🧲🧳🧴🧵🧶🧷🧸🧹🧺🧻🧼🧽🧾🧿🩰🩱🩲🩳🩴🩵🩶🩷🩸🩹🩺🩻🩼🪀🪁🪂🪃🪄🪅🪆🪇🪈🪐🪑🪒🪓🪔🪕🪖🪗🪘🪙🪚🪛🪜🪝🪞🪟🪠🪡🪢🪣🪤🪥🪦🪧🪨🪩🪪🪫🪬🪭🪮🪯🪰🪱🪲🪳🪴🪵🪶🪷🪸🪹🪺🪻🪼🪽🪿🫀🫁🫂🫃🫄🫅🫎🫏🫐🫑🫒🫓🫔🫕🫖🫗🫘🫙🫚🫛🫠🫡🫢🫣🫤🫥🫦🫧🫨🫰🫱🫲🫳🫴🫵🫶🫷🫸‼⌚⌛⌨⏏⏩⏪⏫⏬⏭⏮⏯⏰⏱⏲⏳⏸⏹⏺▶◀☀☁☂☃☄☎☑☔☕☘☝☠☢☣☦☪☮☯☸☹☺♀♂♈♉♊♋♌♍♎♏♐♑♒♓♟♠♣♥♦♨♻♾♿⚒⚓⚔⚕⚖⚗⚙⚛⚜⚠⚡⚧⚪⚫⚰⚱⚽⚾⛄⛅⛈⛎⛏⛑⛓⛔⛩⛪⛰⛱⛲⛳⛴⛵⛷⛸⛹⛺⛽✂✅✈✉✊✋✌✍✏✒✔✖✝✡✨✳✴❄❇❌❎❓❔❕❗❣❤➕➖➗➡⤴⤵⬅⬆⬇⭐⭕🇺🇸🇨🇳🇯🇵🇩🇪🇬🇧🇫🇷🇮🇳🇮🇹🇨🇦🇦🇺🇧🇷🇷🇺🇰🇷🇪🇸🇲🇽🇳🇱🇨🇭🇸🇪🇸🇬🇦🇪🇧🇪🇳🇴🇩🇰🇦🇹🇫🇮🇳🇿🇵🇱🇮🇪🇮🇱🇹🇷🇸🇦🇿🇦🇵🇹🇬🇷🇨🇿🇭🇺🇹🇭🇻🇳🇵🇭🇲🇾🇮🇩🇦🇷🇨🇱🇪🇬🇵🇰🇳🇬🇧🇩🇺🇦';

    // Ensure all svg segments are unique
    const uniqueSet = new Set(puzzle.svgSegments);
    if (puzzle.svgSegments.length !== uniqueSet.size) {
      throw new Error('Puzzle must have unique svg segments!');
    }

    for (const unicodeString of puzzle.svgSegments) {
      try {
        // Function to convert Unicode string to emoji
        function unicodeToEmoji(unicode: string) {
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
          throw new Error('Puzzle has invalid emoji format!');
        }

        // Remove the 'u' prefix from the first part
        const normalizedUnicodeString =
          unicodeParts[0].replace(/^u/, '') +
          (unicodeParts.length === 2 ? '_' + unicodeParts[1] : '');

        // Convert the normalized Unicode string to an emoji
        const emoji = unicodeToEmoji(normalizedUnicodeString);

        // Check if the emoji is in the list of valid emojis
        if (!validEmojis.includes(emoji)) {
          throw new Error(`Puzzle has invalid emoji! ${emoji}`);
        }

        // Ensure all svg segment unicode values are uppercase
        puzzle.svgSegments = puzzle.svgSegments.map((segment) =>
          segment.toUpperCase(),
        );
      } catch (error) {
        throw new Error(`Found an error with the puzzle's SVGs! ${error}`);
      }
    }

    // Validate that all svg segments are in the solution so the user can actually solve the puzzle
    puzzle.record.solution.forEach((item) => {
      if (item.value != '#' && item.value.value.length > 1) {
        if (
          puzzle.svgSegments?.includes(item.value.value.toUpperCase()) === false
        ) {
          throw new Error(
            `Missing segment "${item.value.value}" in puzzle solution!`,
          );
        }
      }
    });

    if (puzzle.svgSegments.length !== 26) {
      throw new Error('Puzzle must have 26 svg segments!');
    }
  }

  return {
    slug,
    puzzle: puzzle as PuzzleProps['puzzle'],
    characterTextureAtlasLookup,
    cellNumberTextureAtlasLookup,
  };
}

export default async function Page({
  params: { slug },
}: {
  params: { slug: string };
}) {
  const props = await getProps(slug);
  return <PuzzlePage {...props} />;
}
