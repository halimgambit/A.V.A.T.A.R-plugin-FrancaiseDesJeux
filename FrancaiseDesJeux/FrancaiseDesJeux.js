import fetch from "node-fetch";
import * as cheerio from "cheerio";

export async function init () {
	await Avatar.lang.addPluginPak('FrancaiseDesJeux');
}

export async function action(data, callback) {

  try {

    const L = await Avatar.lang.getPak('FrancaiseDesJeux', data.language);

    const tblActions = {
      loto: () => lotoEuromillion("loto", data.client, L),
      euromillion: () => lotoEuromillion("euromillions-my-million", data.client, L)
    };

    info("FrancaiseDesJeux:", data.action.command, "from", data.client);

     if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

  } catch (err) {
    if (data.client) Avatar.Speech.end(data.client);
    if (err.message) console.error(err.message);
  }

  callback();
}

const lotoEuromillion = async (fdj, client, L) => {

  try {

    const response = await fetch(`https://www.fdj.fr/jeux-de-tirage/${fdj}/resultats`);

    if (!response.ok) {
      throw new Error("Connexion FDJ impossible");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const dateSelector = fdj === "loto" ? "#title-result-loto" : "#title-result-euromillions";

    const date = $(dateSelector).text().trim();
    const boules = [];

    $('#result-grid-1 span[id^="ball-primary-ball"]').each((i, el) => {
      boules.push($(el).text().trim());
    });

    let phrase = "";

    if (fdj === "loto") {

      const numeroChance = $('#result-grid-1 span[id^="ball-secondary-ball"]').first().text().trim();

      phrase = L.get(["speech.loto", date, boules.join(', '), numeroChance]);

    } else {

      const etoiles = [];

      $('#result-grid-1 span[id^="ball-secondary-ball"]').each((i, el) => {
        etoiles.push($(el).text().trim());
      });

      phrase = L.get(["speech.euromillion", date, boules.join(', '), etoiles.join(' et ')]);

    }

    info(phrase);

    Avatar.speak(phrase, client, () => Avatar.Speech.end(client));

  } catch (err) {
    error("FDJ ERROR:", err.message);
    Avatar.speak(L.get(["speech.error"]), client, () => Avatar.Speech.end(client));
  }
}
