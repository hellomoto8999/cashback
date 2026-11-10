# ConfrontaCashback

Confronto indipendente del cashback reale su acquisti e gift card in Italia.

**Sito live:** https://hellomoto8999.github.io/cashback/  
**FAQ:** https://hellomoto8999.github.io/cashback/faq.html

## Dati

Ultimo aggiornamento: **28/11/2026 alle 03:37** (Europe/Rome).

- **9 piattaforme**
- **4.318 negozi**
- **219 gift card**
- **4.537 offerte totali**

| Piattaforma | Acquisti | Gift card | Note |
|---|---:|---:|---|
| [TopCashback](https://www.topcashback.it/) | 672 | 0 | Cashback acquisti; gift card non disponibili in Italia |
| [BuyOn](https://www.buyon.it/) | 1.236 | 145 | Acquisti + gift card; se Cloudflare blocca si usa l'ultima cache |
| [Bestshopping](https://it.bestshopping.com/) | 3.086 | 5 | Acquisti + gift card; il catalogo GC pubblico può essere parziale |
| [BitCashback](https://bitcashback.net/) | 1.004 | 0 | Acquisti pagati in Bitcoin |
| [LetyShops](https://letyshops.com/) | 58 | 0 | Acquisti |
| [Widilo](https://www.widilo.it/) | 362 | 40 | Acquisti + gift card |
| [Beruby](https://it.beruby.com/) | 1.694 | 0 | Acquisti e viaggi; gift card generiche non per brand |
| [Woolsocks](https://woolsocks.eu/it-IT/cashback) | 672 | 57 | Acquisti + gift card |
| [MyGiftCard](https://esselunga.mygiftcard.it/shop) | 0 | 42 | Solo gift card: sconto immediato, non cashback; 0% = nessuna promo attiva |

I conteggi per piattaforma indicano quante offerte riportano almeno una percentuale o un importo su quella piattaforma.

## Come funziona

Il sito è statico: HTML, CSS e JavaScript, senza backend e senza database. Un container locale esegue ogni notte gli scraper Python delle piattaforme, unisce i risultati in `site/data.json` e `site/data.js`, e pubblica la build su GitHub Pages.

- Raccolta: ogni notte alle 02:00 Europe/Rome.
- Merge: normalizzazione di nomi, categorie e offerte; deduplica per negozio.
- Pubblicazione: GitHub Pages, con deploy automatico dopo il build.
- Dati: percentuali e importi pubblici delle piattaforme; nessun dato utente.

## Cosa c'è nel repository

| File | Contenuto |
|---|---|
| `index.html` | Home e tabella di confronto |
| `faq.html` | Soglie, pagamenti e regole delle piattaforme |
| `app.js` | Ricerca, filtri, ordinamento, paginazione |
| `style.css` | Sistema visivo chiaro/scuro |
| `theme.js` | Tema chiaro/scuro/sistema |
| `data.js`, `data.json` | Dataset pubblico delle offerte |
| `fonts/`, `favicon.svg` | Font locali e icona |
| `.nojekyll` | Disattiva Jekyll su GitHub Pages |

Il codice degli scraper non è pubblicato: gira solo sul server locale. La newsletter settimanale è anch'essa locale e non fa parte del sito pubblico.

## Privacy

- Nessun form, nessun account, nessun cookie di profilazione.
- Il tema chiaro/scuro viene salvato solo nel `localStorage` del browser.
- È attivo **Cloudflare Web Analytics**, senza cookie e con dati aggregati.
- Nessun link affiliato: i link alle piattaforme sono diretti.
- Nel repository non ci sono dati personali, token o chiavi API.

## Limiti

- Le percentuali cambiano spesso: verificare sempre le condizioni sulla piattaforma prima di acquistare.
- BuyOn è protetto da Cloudflare: quando blocca, il dataset usa l'ultima copia disponibile.
- Il catalogo gift card pubblico di Bestshopping può essere parziale.
- MyGiftCard è sconto immediato, non cashback; 0% significa nessuna promozione attiva.
- Il sito non è affiliato ai marchi citati e non fornisce consulenza finanziaria.

## Aggiornamento

Il README e i dati vengono rigenerati dal deploy notturno. Per aggiornare manualmente il sito:

```bash
/opt/cashback-compare/cron_update.sh
```

Per la sola pubblicazione:

```bash
/opt/cashback-compare/deploy_github.sh
```

## Segnalazioni

Per correzioni su negozi, categorie o percentuali, aprire una issue su GitHub:

https://github.com/hellomoto8999/cashback/issues

## Disclaimer

I dati sono raccolti da pagine pubbliche e possono contenere errori o ritardi. Le percentuali di cashback sono informative e non costituiscono un consiglio finanziario. I marchi citati appartengono ai rispettivi proprietari.
