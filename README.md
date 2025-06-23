__ComplicityGraph__ is a visual tool for exploring implication of various actors in the Palestinian Genocide. It queries its data directly from the frequenty updated [WikiData database](https://www.wikidata.org/wiki/Q124086054). 

Test it here : https://tristounegg.github.io/complicitygraph/

Run it locally : `python3 -m http.server 8000` and go to http://localhost:8000/

Adapted from [ideograph](https://ourednik.info/ideograph).

Licenced under [GNU GPL 3.0](https://www.gnu.org/licenses/gpl-3.0.html).

## To do : 
- [ ]  filter first iteration base on "instace of" (allow everything exept from public institutions ? )
- [ ]  make colors depend on instance type 
- [ ]  create legend 
  - [ ]  display color distance
  - [ ]  display shape instanceof
- [ ] improove navigation
  - [ ] add an html section : who is on this graph ? 
  - [ ] add an html section : what is on this graph ? 

