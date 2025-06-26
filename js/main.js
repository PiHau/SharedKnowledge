// =============================
// IMPORT DES MODULES
// =============================
import initMap from './map.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

// =============================
// CONFIGURATION DES URLS
// =============================
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdHMVzILg1T_I0OT1CGgDybNLSr8o9i6w4oBRTUU4u9RBXD6Q/formResponse';
const EMAIL_ENTRY = 'entry.1662800066';
const FORMSPREE_URL = 'https://formspree.io/f/mwpbrdlr';

// =============================
// OUTILS / UTILITAIRES
// =============================
const cleanId = v => (v ?? '').toString().trim();

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

// =============================
// AFFICHAGE DE LA MODALE D’INFORMATION (DISCLAIMER)
// =============================
function showDisclaimer() {
  const overlay = d3.select('body')
    .append('div')
    .attr('class','sk-overlay')
    .style('opacity',0);

  const modal = overlay.append('div')
    .attr('class','sk-modal')
    .style('transform','scale(.85)');

  modal.append('h2').text('Informations sur le projet');

  const scroll = modal.append('div')
    .attr('class','sk-scroll')
    .style('max-height','60vh')
    .style('overflow-y','auto')
    .style('padding-right','1rem');

  scroll.append('section').html(`
    <h3>Description du projet</h3>
 <p><strong>SharedKnowledge</strong> est un prototype cartographique de participation
    citoyenne, développé dans le cadre d’un mémoire de master en
    <em>Analyse spatiale et systèmes complexes</em> (UNIL).<br><br>
    <b>Le but de ce projet est de rendre l'urbanisme accessible, dans sa forme la plus simple, à l'ensemble de la population,</b>
    en rassemblant les informations nécessaires et contextuelles pour la compréhension des projets et de leur inscription dans l'espace régional.<br>
    La plateforme est conçue pour être adaptée aussi bien aux novices qu’aux personnes qui souhaitent approfondir&nbsp;: accès à des liens vers la documentation officielle, cartes thématiques et informations complémentaires.<br><br>
    Le projet vise à explorer si une plateforme numérique simple et intuitive peut faciliter la participation citoyenne dans l’urbanisme.
    </p>
  `);

  scroll.append('section').html(`
    <h3>Utilisation</h3>
      <ul>
      <li>3 notes Likert + 1 phrase affirmative (max. 100 mots).</li>
      <li>Aucune question ouverte : les phrases sont analysées par text-mining.</li>
      <li>L’adresse e-mail est facultative (pour recevoir le rapport agrégé).</li>
      <li>Pour chaque projet, vous pouvez accéder à la documentation et à des cartes supplémentaires.</li>
    </ul>
  `);

  scroll.append('section').html(`
    <h3>Résultats</h3>
    <p>Les notes sont agrégées, les phrases sont lues et analysées (SpaCy). Un rapport PDF sera envoyé aux participants ayant fourni
    leur e-mail.<br>
    Cette expérimentation sert à évaluer le potentiel d’une telle plateforme pour encourager la participation et la compréhension des projets d’urbanisme.</p>
  
  `);

  scroll.append('section').html(`
    <h3>Contexte scientifique</h3>
    <p>Il s’agit d’un projet académique : les données ne seront pas publiées
    individuellement, seulement analysées dans un cadre de recherche. Les réponses n'influeront pas les décisions, elles servent à explorer "ce qu'il est possible de faire".</p>
  `);

  scroll.append('section').html(`
    <h3>Confidentialité</h3>
    <ul>
      <li>Seule votre adresse e-mail est collectée ; aucune donnée personnelle
          n’est stockée avec vos réponses.</li>
      <li>Les adresses sont conservées dans une feuille Google Sheets privée,
          séparée des résultats.</li>
      <li>Aucune exploitation des données personnelles, en dehors de l'envoi du rapport.</li>
      <li>Code source : <a href="https://github.com/PiHau/SharedKnowledge"
          target="_blank">GitHub</a>.</li>
    </ul>
  `);

  scroll.append('section').html(`
    <h3>Contact</h3>
    <p><a href="mailto:pierre.hauptmann@unil.ch">pierre.hauptmann@unil.ch</a></p>
  `);

  const controls = modal.append('div').attr('class','sk-controls');

  const emailInput = controls.append('input')
    .attr('type','email')
    .attr('class','sk-email-input')
    .attr('placeholder','votre@adresse.ch');
    
/* Piege pour bot*/
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

  overlay.transition().duration(500).style('opacity',1);
  modal.transition().duration(500).style('transform','scale(1)');
}

// =============================
// AFFICHAGE INFOS PROJET
// =============================
window.openProjectInfo = function(infoObj, shortName){
  if (!infoObj){ console.warn('Infos manquantes pour', shortName); return; }

  const box = d3.select('#info')
                .style('display','block')
                .html('')
                .style('opacity',0);

  box.append('h2').text(shortName);
  box.append('br');
  box.append('p')
      .attr('class','meta')
      .html(
        `<strong>Date&nbsp;de&nbsp;début&nbsp;:</strong> ${infoObj.start || '-'} &nbsp;&nbsp; 
         <strong>Date&nbsp;cible&nbsp;:</strong> ${infoObj.target || '-'}`
      );
  box.append('br');
  box.append('p')
      .attr('class','summary')
      .text(infoObj.summary || '')
      .style('white-space','pre-line');
  box.append('br');
  const ul = box.append('ul');
  (infoObj.objectives || []).forEach(o => ul.append('li').text(o));
  const links = box.append('div').style('margin-top','1rem');
  if (infoObj.link1) links.append('a')
        .attr('href', infoObj.link1).attr('target','_blank')
        .text('Informations supplémentaires - Lien 1').style('margin-right','1rem');
  if (infoObj.link2) links.append('a')
        .attr('href', infoObj.link2).attr('target','_blank')
        .text('Informations supplémentaires - Lien 2');
  box.transition().duration(500).style('opacity',1);
};

// =============================
// SIDEBAR DES QUESTIONS (DROITE)
// =============================
function openSidebarForProject(id, shortName) {
  const cfg = window.questionsMap[id];
  if (!cfg) { console.warn('questionsMap manquant', id); return; }

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

  const sendBtn = form.append('button')
                      .attr('type', 'submit')
                      .text('Envoyer')
                      .node();

  form.on('submit', function (e) {
    e.preventDefault();
    const fd = new FormData(this);
    const nQ = cfg.questions.length;
    for (let i = 1; i <= nQ; i++) {
      if (!fd.get('q' + i)) {
        alert(`Merci de répondre aux ${nQ} questions.`);
        return;
      }
    }
    const payload = new URLSearchParams({ project: id });
    for (let i = 1; i <= nQ; i++) payload.append('q' + i, fd.get('q' + i));
    payload.append('comment', fd.get('commentaire') || '');
    payload.append('email', localStorage.getItem('sk_email') || 'anon@sk.local');

    fetch(FORMSPREE_URL, {
      method : 'POST',
      mode   : 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body   : payload.toString()
    }).catch(()=>{});

    sendBtn.disabled   = true;
    const oldTxt       = sendBtn.textContent;
    sendBtn.textContent = 'Réponse envoyée !';

    setTimeout(() => {
      sendBtn.disabled   = false;
      sendBtn.textContent = oldTxt;
      side.attr('hidden', true);
    }, 1000);
  });

  side.transition().duration(400).style('opacity', 1);
}

// =============================
// ENTRÉE PRINCIPALE : INITIALISATION DU SITE
// =============================
window.addEventListener('DOMContentLoaded',()=>{

  const map = initMap();

  Promise.all([
    d3.csv('csv/questions.csv'),
    d3.csv('csv/infos.csv')
  ]).then(([qRows,iRows])=>{

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

    const listItems = d3.selectAll('#projects li');
    styleButtons(listItems);

    listItems.on('click',function(){

      const id        = cleanId(d3.select(this).attr('data-id'));
      const file      = d3.select(this).attr('data-file');
      const shortName = d3.select(this).text();

      listItems.classed('active',false).style('background-color',null);
      d3.select(this).classed('active',true).style('background-color','var(--gray-50)');

      map.eachLayer(l => { if(l.feature) map.removeLayer(l); });

         // ... tout ton code d'avant ...

 
  fetch(`geojson_europe/${file}`)
  .then(r => r.json())
  .then(data => {
    const layer = L.geoJSON(data, {
      style: function(feature) {
        // Pour les lignes
        if (
          feature.geometry.type === "LineString" ||
          feature.geometry.type === "MultiLineString"
        ) {
          return {
            color: '#e90808',     // ← Rouge vif (contour)
            weight: 2,
            fill: false,
            fillOpacity: 0
          };
        }
        // Pour les polygones
        return {
          color: '#e90808',      // ← Rouge vif (contour)
          fillColor: '#e90808',  // ← Rouge vif (remplissage)
          weight: 2,
          fillOpacity: 0.3
        };
      }
    }).addTo(map);

    if (layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds().pad(0.2));
    }
    openProjectInfo(window.infosMap[id], shortName);
    openSidebarForProject(id, shortName);
  })
  .catch(err => console.error(`Erreur chargement ${file} :`, err));
 }); 
    showDisclaimer();
  }) 
  .catch(err => console.error('Erreur chargement CSV :', err));
}); 
