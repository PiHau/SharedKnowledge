// js/main.js
import initMap from './map.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

/* -----------------------------------------------------------------
   CONFIG – URL Google Forms pour la collecte d’e-mails
------------------------------------------------------------------ */

const FORM_URL    = 'https://docs.google.com/forms/d/e/1FAIpQLSdHMVzILg1T_I0OT1CGgDybNLSr8o9i6w4oBRTUU4u9RBXD6Q/formResponse';

const EMAIL_ENTRY = 'entry.1662800066';

/* URL Formspree : copie celle que ton tableau de bord t’a donnée */
const FORMSPREE_URL = 'https://formspree.io/f/mwpbrdlr';

/* -----------------------------------------------------------------
   OUTILS
------------------------------------------------------------------ */
const cleanId = v => (v ?? '').toString().trim();        // supprime espaces parasites

function styleButtons(selection) {
  selection
    .style('display','block')
    .style('border','1px solid var(--gray-200)')
    .style('border-radius','4px')
    .style('padding','0.5rem 1rem')
    .style('margin','0.5rem 0')
    .style('background-color','#fff')
    .style('cursor','pointer')
    .style('transition','background-color .2s')
    .on('mouseover', function(){ d3.select(this).style('background-color','var(--gray-50)'); })
    .on('mouseout',  function(){
      if(!d3.select(this).classed('active')){
        d3.select(this).style('background-color','#fff');
      }
    });
}

/* -----------------------------------------------------------------
   DISCLAIMER (modal)
------------------------------------------------------------------ */
function showDisclaimer() {

  const overlay = d3.select('body')
    .append('div')
    .attr('class','sk-overlay')
    .style('opacity',0);

  const modal = overlay.append('div')
    .attr('class','sk-modal')
    .style('transform','scale(.85)');

  modal.append('h2').text('Informations sur le projet');

  /* --- contenu scrollable -------------------------------------- */
  const scroll = modal.append('div')
    .attr('class','sk-scroll')
    .style('max-height','60vh')
    .style('overflow-y','auto')
    .style('padding-right','1rem');

  scroll.append('section').html(`
    <h3>Description du projet</h3>
    <p><strong>ShareKnowledge</strong> est un prototype cartographique de participation
    citoyenne, développé dans le cadre d’un mémoire de master en
    <em>Analyse spatiale et systèmes complexes</em> (UNIL). Il explore l’intérêt
    d’un dispositif géolocalisé pour impliquer les habitants dans l’urbanisme.</p>
  `);

  scroll.append('section').html(`
    <h3>Utilisation</h3>
    <ul>
      <li>3 notes Likert + 1 phrase affirmative (max. 100 mots).</li>
      <li>Aucune question ouverte : les phrases sont analysées par text-mining.</li>
      <li>L’adresse e-mail est facultative (pour recevoir le rapport agrégé).</li>
    </ul>
  `);

  scroll.append('section').html(`
    <h3>Résultats</h3>
    <p>Les notes sont agrégées et les phrases passée à un traitement de
    texte miné. Un rapport PDF sera envoyé aux participants ayant fourni
    leur e-mail.</p>
  `);

  scroll.append('section').html(`
    <h3>Contexte scientifique</h3>
    <p>Il s’agit d’un projet académique : les données ne seront pas publiées
    individuellement, seulement analysées dans un cadre de recherche.</p>
  `);

  scroll.append('section').html(`
    <h3>Confidentialité</h3>
    <ul>
      <li>Seule votre adresse e-mail est collectée ; aucune donnée personnelle
          n’est stockée avec vos réponses.</li>
      <li>Les adresses sont conservées dans une feuille Google Sheets privée,
          séparée des résultats.</li>
      <li>Aucune exploitation commerciale.</li>
      <li>Code source : <a href="https://github.com/PiHau/SharedKnowledge"
          target="_blank">GitHub</a>.</li>
    </ul>
  `);

  scroll.append('section').html(`
    <h3>Contact</h3>
    <p><a href="mailto:pierre.hauptmann@unil.ch">pierre.hauptmann@unil.ch</a></p>
  `);

  /* --- zone e-mail + boutons ----------------------------------- */
  const controls = modal.append('div').attr('class','sk-controls');

  const emailInput = controls.append('input')
    .attr('type','email')
    .attr('class','sk-email-input')
    .attr('placeholder','votre@adresse.ch');

  // champ invisible anti-bot
  controls.append('input')
    .attr('type','email')
    .attr('name','email2')
    .style('display','none')
    .style('visibility','hidden');

  const addBtn   = controls.append('button').attr('class','sk-btn-add').text('Ajouter');
  const skipBtn  = controls.append('button').attr('class','sk-btn-no').text('Non merci');
  const acceptBtn= modal.append('button').attr('class','sk-accept').attr('disabled',true).text("J'accepte");

  addBtn.on('click',()=>{
    const email = emailInput.node().value.trim();
    if(!emailInput.node().checkValidity()){
      alert('Adresse e-mail invalide'); return;
    }
    fetch(FORM_URL,{
      method:'POST', mode:'no-cors',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({[EMAIL_ENTRY]:email}).toString()
    }).finally(()=>{
      emailInput.attr('disabled',true);
      addBtn.attr('disabled',true);
      acceptBtn.attr('disabled',null);
      localStorage.setItem('sk_email',email);
    });
  });

  skipBtn.on('click',()=>{
    emailInput.attr('disabled',true);
    addBtn.attr('disabled',true);
    skipBtn.attr('disabled',true);
    acceptBtn.attr('disabled',null);
  });

  acceptBtn.on('click',()=>{
    overlay.transition().duration(400)
      .style('opacity',0)
      .on('end',()=>overlay.remove());
  });

  /* animation d’apparition */
  overlay.transition().duration(500).style('opacity',1);
  modal.transition().duration(500).style('transform','scale(1)');
}

/*Info*/
window.openProjectInfo = function(infoObj, shortName){
  if (!infoObj){ console.warn('Infos manquantes pour', shortName); return; }

  const box = d3.select('#info')
                .style('display','block')
                .html('')
                .style('opacity',0);

  /* ── Titre ───────────────────────────────────── */
  box.append('h2').text(shortName);

  box.append('br');                       // saut de ligne après le titre

  /* ── Dates collées ───────────────────────────── */
  box.append('p')
      .attr('class','meta')
      .html(
        `<strong>Date&nbsp;de&nbsp;début&nbsp;:</strong> ${infoObj.start || '-'} &nbsp;&nbsp; 
         <strong>Date&nbsp;cible&nbsp;:</strong> ${infoObj.target || '-'}`
      );

  box.append('br');                       // saut de ligne après les dates

  /* ── Résumé ──────────────────────────────────── */
  box.append('p')
      .attr('class','summary')
      .text(infoObj.summary || '')
      .style('white-space','pre-line');   // garde les \n éventuels

  box.append('br');                       // saut de ligne après le résumé

  /* ── Objectifs (bullet-list) ─────────────────── */
  const ul = box.append('ul');
  (infoObj.objectives || []).forEach(o => ul.append('li').text(o));

  /* ── Liens ───────────────────────────────────── */
  const links = box.append('div').style('margin-top','1rem');
  if (infoObj.link1) links.append('a')
        .attr('href', infoObj.link1).attr('target','_blank')
        .text('Informations supplémentaires - Lien 1').style('margin-right','1rem');
  if (infoObj.link2) links.append('a')
        .attr('href', infoObj.link2).attr('target','_blank')
        .text('Informations supplémentaires - Lien 2');

  /* fade-in doux */
  box.transition().duration(500).style('opacity',1);
};

/* -----------------------------------------------------------------
   SIDEBAR QUESTIONS (droite)
------------------------------------------------------------------ */
function openSidebarForProject(id, shortName) {
  const cfg = window.questionsMap[id];
  if (!cfg) { console.warn('questionsMap manquant', id); return; }

  /* ---------- conteneur latéral ---------- */
  const side = d3.select('#sidebar')
                 .attr('hidden', null)
                 .html('')
                 .style('opacity', 0);

  side.append('button')
      .attr('class', 'sk-sidebar-close')
      .text('×')
      .on('click', () => side.attr('hidden', true));

  styleButtons(side.selectAll('button'));
  side.append('h2').text(`Questions – ${shortName}`);

  /* ---------- formulaire ---------- */
  const form = side.append('form').attr('class', 'sk-zone-form');

  cfg.questions.forEach((q, i) => {
    form.append('label').text(q);
    const row = form.append('div').attr('class', 'sk-likert');
    for (let v = 1; v <= 5; v++) {
      row.append('label')
         .html(`<input type="radio" name="q${i + 1}" value="${v}" required> ${v}`);
    }
  });

  form.append('label')
      .text(cfg.commentLabel)
      .append('textarea')
      .attr('name', 'commentaire')
      .attr('rows', 3);

  /* ----- bouton d’envoi ----- */
  const sendBtn = form.append('button')
                      .attr('type', 'submit')
                      .text('Envoyer')
                      .node();              // DOM element

  /* ---------- soumission ---------- */
  form.on('submit', function (e) {
    e.preventDefault();

    /* validation : tout coché */
    const fd = new FormData(this);
    const nQ = cfg.questions.length;
    for (let i = 1; i <= nQ; i++) {
      if (!fd.get('q' + i)) {
        alert(`Merci de répondre aux ${nQ} questions.`);
        return;
      }
    }

    /* payload x-www-form-urlencoded */
    const payload = new URLSearchParams({ project: id });
    for (let i = 1; i <= nQ; i++) payload.append('q' + i, fd.get('q' + i));
    payload.append('comment', fd.get('commentaire') || '');

    /* e-mail obligatoire pour Formspree : valeur réelle ou “anon@sk.local” */
    payload.append('email', localStorage.getItem('sk_email') || 'anon@sk.local');

    /* envoi silencieux : aucune erreur affichée même si Formspree répond 302/400 */
    fetch(FORMSPREE_URL, {
      method : 'POST',
      mode   : 'no-cors',                       // pas de lecture de réponse → pas d’erreur CORS
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body   : payload.toString()
    }).catch(()=>{});                          // on ignore toute exception réseau

    /* feedback sur le bouton */
    sendBtn.disabled   = true;
    const oldTxt       = sendBtn.textContent;
    sendBtn.textContent = 'Réponse envoyée !';

    setTimeout(() => {
      sendBtn.disabled   = false;
      sendBtn.textContent = oldTxt;
      side.attr('hidden', true);               // ferme la barre latérale
    }, 1000);
  });

  /* apparition douce */
  side.transition().duration(400).style('opacity', 1);
}


/* -----------------------------------------------------------------
   ENTRÉE PRINCIPALE
------------------------------------------------------------------ */
window.addEventListener('DOMContentLoaded',()=>{

  const map = initMap();   // ─ initialise Leaflet immédiatement

  /* Charge CSV questions + infos puis only THEN active l’IU */
  Promise.all([
    d3.csv('csv/questions.csv'),
    d3.csv('csv/infos.csv')
  ]).then(([qRows,iRows])=>{

    /* 1. Maps en mémoire -------------------------------------------------------- */
    window.questionsMap = {};
    qRows.forEach(r=>{
      const id = cleanId(r.id);
      window.questionsMap[id] = {
        questions:    [r.question1,r.question2,r.question3,r.question4,r.question5, r.question6],
        commentLabel: r.comment_label
      };
    });

    window.infosMap = {};
    iRows.forEach(r=>{
      const id = cleanId(r.id);
      window.infosMap[id] = {
        start:      r.start,
        target:     r.target,
        objectives: (r.objectives||'').split('|'),
        link1:      r.link1,
        link2:      r.link2,
        summary:    r.summary
      };
    });

    /* 2. Liste de projets ------------------------------------------------------- */
    const listItems = d3.selectAll('#projects li');
    styleButtons(listItems);

    listItems.on('click',function(){

      const id        = cleanId(d3.select(this).attr('data-id'));
      const file      = d3.select(this).attr('data-file');
      const shortName = d3.select(this).text();

      /* highlight ------------------------------------------------------------- */
      listItems.classed('active',false).style('background-color',null);
      d3.select(this).classed('active',true).style('background-color','var(--gray-50)');

      /* purge des GeoJSON précédents ------------------------------------------ */
      map.eachLayer(l => { if(l.feature) map.removeLayer(l); });

      /* chargement nouveau GeoJSON -------------------------------------------- */
      fetch(`geojson_europe/${file}`)
        .then(r => r.json())
        .then(data => {
          const layer = L.geoJSON(data,{ style:{color:'var(--accent)',weight:2,fillOpacity:0.3} }).addTo(map);
          if(layer.getBounds().isValid()) map.fitBounds(layer.getBounds().pad(0.2));

          /* mise à jour info + questions ------------------------------------ */
          openProjectInfo(window.infosMap[id], shortName);
          openSidebarForProject(id, shortName);
        })
        .catch(err => console.error(`Erreur chargement ${file} :`, err));
    });

    /* 3. disclaimer ------------------------------------------------------------ */
    showDisclaimer();
  })
  .catch(err => console.error('Erreur chargement CSV :', err));
});
