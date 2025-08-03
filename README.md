**ComplicityGraph** is a visual tool for exploring implication of various actors in the Palestinian Genocide. It queries its data directly from the frequenty updated [WikiData database](https://www.wikidata.org/wiki/Q124086054).

Run it locally : `python3 -m http.server 8000` and go to http://localhost:8000/

Adapted from [ideograph](https://ourednik.info/ideograph).

Licenced under [GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.html).

## To do :

- [ ] filter first iteration base on "instance of" (allow everything except from public institutions ? ) do not follow instance of stock market index
- [ ] create legend
  - [ ] display color distance
  - [ ] display shape instanceof
- [ ] use relation link type to generate emails models (you are $linktype of $institution, which benefits from the palestinian genocide through $institution. The source of this alleagation can be found on wikidata $wikidatobjecturllist)
- [x] exclude ceo end time after octber 7
- [x] exclude P576 (dissolved, abolished or demolished date) after october 7

## What is Complicity

## Direct Complicity

- Selling weapons (military tools including AI and other infrastructures) during the genocide
- Participating technically or economically in the illegal settlements and colonization
- Using Israel fallacious arguments to justify the attacks, spread fallacious argument in favor of Israel occupation

## Indirect complicity

- Subsidiary is being an accomplice and the main business does nothing. References : http://globalnaps.org/issue/human-rights-due-diligence, German Supply Chain Due Diligence Act
- Investing in enterprises being direct accomplices during the genocide
