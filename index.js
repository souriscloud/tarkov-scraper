const pupp = require('puppeteer');

const baseUrl = 'https://escapefromtarkov.fandom.com/'
const ammoBaseUrl = `${baseUrl}/wiki/Ammunition`;
const ballisticsUrl = `${baseUrl}/wiki/Ballistics`;

async function safeCockin (page) {
  console.log('Cheking Cockin frame...');
  try {
    await page.click('[data-tracking-opt-in-accept]');
    console.log('Cookies Opt-In OK');
  } catch (cockinExc) {
    console.log('Cookies Opt-In not found');
  }
}

async function ammoImageUrl (browser, pageUrl) {
  const page = await browser.newPage();
  await page.goto(pageUrl);
  await safeCockin(page);
  const infoBoxIcon = await page.$('td.va-infobox-icon')
  if (infoBoxIcon) {
    const iconImg = await infoBoxIcon.$('img')
    if (iconImg) {
      return (await iconImg.getProperty('src')).jsonValue();
    } else {
      return null;
    }
  } else {
    return null;
  }
}

async function ballistics (browser) {
  let anchors = null;
  console.log('[ballistics]');
  const page = await browser.newPage();

  console.log('Loading ballistics url:', ballisticsUrl);
  await page.goto(ballisticsUrl);
  
  await safeCockin(page);

  console.log('wikiTables');
  const wikiTables = await page.$$('table.wikitable');
  if (wikiTables && wikiTables.length === 4) {
    const anchorsTable = wikiTables[2];
    anchors = await anchorsTable.$$eval('tr td a', evalAnchors => {
      return evalAnchors.map(anchor => ({
        title: anchor.textContent,
        hash: anchor.hash
      }))
    })
    console.log('anchors:', anchors);

    console.log('trying to get table subset of every anchor');
    const penetrationTable = wikiTables[3];
    const penetrationBody = await penetrationTable.$('tbody');
    const penetrationRows = await penetrationBody.$$('tr');
    console.log('penetration rows:', penetrationRows.length);
    let lastRowAnchor = null;
    const rows = penetrationRows.map(async row => {
      const rowId = await (await row.getProperty('id')).jsonValue();
      const rowData = {
        url: '',
        icon: '',
        name: '',
        damage: '',
        penetrationPower: '',
        armorDamagePercentage: '',
        accuracyPercentage: '',
        recoilPercentage: '',
        fragmentationChancePercentage: '',
        bleedingPercentage: {
          light: '',
          heavy: ''
        },
        bulletEffectivenessAgainstArmorClass: {
          1: '',
          2: '',
          3: '',
          4: '',
          5: '',
          6: ''
        }
      }
      const rowResult = {
        anchor: null,
        row: null
      }

      const getRowColumnText = async (columnIndex, anchoredRowColumns) => (await (await anchoredRowColumns[columnIndex].getProperty('textContent')).jsonValue()).trim().replace(/\n|\r/g, '')
      const getRowUrl = async (columnIndex, anchoredRowColumns) => (await (await (await anchoredRowColumns[columnIndex].$('a')).getProperty('href')).jsonValue()).trim()
      if (rowId) {
        rowResult.anchor = `#${rowId}`;
        const rowAnchor = anchors.find(anc => anc.hash === `#${rowId}`);
        if (rowAnchor) {
          lastRowAnchor = rowAnchor

          const anchoredRowColumns = await row.$$('td');
          if (anchoredRowColumns.length === 16) {
            rowData.url = await getRowUrl(1, anchoredRowColumns);
            rowData.name = await getRowColumnText(1, anchoredRowColumns);
            rowData.damage = await getRowColumnText(2, anchoredRowColumns);
            rowData.penetrationPower = await getRowColumnText(3, anchoredRowColumns);
            rowData.armorDamagePercentage = await getRowColumnText(4, anchoredRowColumns);
            rowData.accuracyPercentage = await getRowColumnText(5, anchoredRowColumns);
            rowData.recoilPercentage = await getRowColumnText(6, anchoredRowColumns);
            rowData.fragmentationChancePercentage = await getRowColumnText(7, anchoredRowColumns);
            rowData.bleedingPercentage.light = await getRowColumnText(8, anchoredRowColumns);
            rowData.bleedingPercentage.heavy = await getRowColumnText(9, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[1] = await getRowColumnText(10, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[2] = await getRowColumnText(11, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[3] = await getRowColumnText(12, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[4] = await getRowColumnText(13, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[5] = await getRowColumnText(14, anchoredRowColumns);
            rowData.bulletEffectivenessAgainstArmorClass[6] = await getRowColumnText(15, anchoredRowColumns);
            rowResult.row = rowData;
          } else {
            console.log('anchoredRowColumns', anchoredRowColumns.length);
          }
        }
      } else {
        rowResult.anchor = lastRowAnchor.hash;
        const anchoredRowColumns = await row.$$('td');
        if (anchoredRowColumns.length === 15) {
            rowData.url = await getRowUrl(0, anchoredRowColumns);
            rowData.name = await getRowColumnText(0, anchoredRowColumns);
          rowData.damage = await getRowColumnText(1, anchoredRowColumns);
          rowData.penetrationPower = await getRowColumnText(2, anchoredRowColumns);
          rowData.armorDamagePercentage = await getRowColumnText(3, anchoredRowColumns);
          rowData.accuracyPercentage = await getRowColumnText(4, anchoredRowColumns);
          rowData.recoilPercentage = await getRowColumnText(5, anchoredRowColumns);
          rowData.fragmentationChancePercentage = await getRowColumnText(6, anchoredRowColumns);
          rowData.bleedingPercentage.light = await getRowColumnText(7, anchoredRowColumns);
          rowData.bleedingPercentage.heavy = await getRowColumnText(8, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[1] = await getRowColumnText(9, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[2] = await getRowColumnText(10, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[3] = await getRowColumnText(11, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[4] = await getRowColumnText(12, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[5] = await getRowColumnText(13, anchoredRowColumns);
          rowData.bulletEffectivenessAgainstArmorClass[6] = await getRowColumnText(14, anchoredRowColumns);
          rowResult.row = rowData;
          } else {
          console.log('anchoredRowColumns', anchoredRowColumns.length);
        }
      }
      console.log(rowResult.row.url);
      return rowResult
    })
    const resolvedRows = await Promise.all(rows);
    console.log('penetrationTable fetched');
    resolvedRows.forEach(rr => {
      const found = anchors.findIndex(anc => anc.hash === rr.anchor)
      if (found !== -1) {
        anchors[found] = {
          ...anchors[found],
          rows: anchors[found].rows && anchors[found].rows.length ? [...anchors[found].rows, rr.row] : [rr.row]
        }
      } else {
        console.log('some anchor has not been found! Check it out', rr);
      }
    })

    console.log('Penetration tables fetched and converted OK!')
  } else {
    console.log('Wrong count of wikiTables found!');
  }

  await page.pdf({ path: 'ballisticsTest.pdf' });
  await page.close();
  console.log('[ballistics] end');
  return anchors;
}

async function test (browser) {
  console.log('[test]');
  const page = await browser.newPage();

  await page.goto(ammoBaseUrl);
  
  await safeCockin(page);

  await page.screenshot({ path: 'ammoTest.png' });
  await page.pdf({ path: 'ammoTest.pdf' });

  console.log('[test] end');
  await page.close();
}

(async () => {
  console.log('launching browser...')
  const browser = await pupp.launch({
    dumpio: false,

  })

  const ballisticsTable = await ballistics(browser)
  console.log('ballisticsTable');
  console.log(ballisticsTable);

  console.log('closing browser...');
  await browser.close()
})();
