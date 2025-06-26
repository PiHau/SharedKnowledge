// =============================
// INITIALISATION DE LA CARTE LEAFLET
// =============================
export default function initMap () {

  // =============================
  // CRÉATION DE LA CARTE
  // =============================
  const map = L.map('map', { center:[46.52, 6.63], zoom:12 });
  map.createPane('overlayPane');
  map.getPane('overlayPane').style.zIndex = 650;

  // =============================
  // FONDS DE CARTE
  // =============================
  const baseLayers = {
    'CartoDB Positron': L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution:'© CARTO / OpenStreetMap', subdomains:'abcd', maxZoom:19 }
    ).addTo(map),

    'Orthophoto 2019': L.tileLayer(
      'https://wmts10.geo.admin.ch/1.0.0/ch.swisstopo.swissimage-product/default/current/3857/{z}/{x}/{y}.jpeg',
      { attribution:'© swisstopo', maxZoom:18 }
    ),

    'Swisstopo (fond gris)': L.tileLayer(
      'https://wmts{s}.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg',
      { attribution:'© swisstopo', subdomains:'0123', maxZoom:19 }
    ),

    'OpenTopoMap': L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      { attribution:'© OpenTopoMap & OpenStreetMap', maxZoom:17 }
    ),

    'OpenStreetMap': L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution:'© OpenStreetMap', maxZoom:19 }
    )
  };

  // =============================
  // COUCHES WMS (OVERLAYS FIXES)
  // =============================
  const overlayLayers = {
    'Limites communales': {
      layer: L.tileLayer.wms('https://wms.geo.admin.ch/', {
        layers:'ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill',
        transparent:true,format:'image/png',version:'1.3.0',pane:'overlayPane'
      }), color:null
    },
    'Arrêts TP': {
      layer: L.tileLayer.wms('https://wms.geo.admin.ch/', {
        layers:'ch.bav.haltestellen-oev',
        transparent:true,format:'image/png',version:'1.3.0',pane:'overlayPane'
      }), color:null
    },
    'Zones à bâtir': {
      layer: L.tileLayer.wms('https://wms.geo.admin.ch/', {
        layers:'ch.are.bauzonen',
        transparent:true,format:'image/png',version:'1.3.0',pane:'overlayPane'
      }), color:null
    },
    'Affectation du sol': {
      layer: L.tileLayer.wms('https://wms.geo.admin.ch/', {
        layers:'ch.bfs.arealstatistik-bodenbedeckung',
        transparent:true,format:'image/png',version:'1.3.0',pane:'overlayPane'
      }), color:null
    }
  };

  // =============================
  // LÉGENDES DES COUCHES
  // =============================
  const bauzonenLegend = L.control({ position:'bottomright' });
  bauzonenLegend.onAdd = () => {
    const d = L.DomUtil.create('div','legend');
    Object.assign(d.style,{background:'#fff',padding:'6px',boxShadow:'0 0 15px rgba(0,0,0,.2)'});
    d.innerHTML = '<img src="png/ch.are.bauzonen_fr.png" style="max-width:300px;">';
    return d;
  };

  const landuseLegend = L.control({ position:'bottomright' });
  landuseLegend.onAdd = () => {
    const d = L.DomUtil.create('div','legend');
    Object.assign(d.style,{background:'#fff',padding:'6px',boxShadow:'0 0 15px rgba(0,0,0,.2)'});
    d.innerHTML = '<img src="png/legend_affectation_sol.png" style="max-width:300px;">';
    return d;
  };

  // =============================
  // POINTS D’INTÉRÊT (POI) — RESTAURANTS, CAFÉS, ETC. 
  // COULEUR UNIQUE POUR CHAQUE TYPE + PETIT RAYON
  // =============================
  const poiConfig = {
    'Restaurants': { key:'restaurant', color:'#ff5252' },   // rouge
    'Cafés'      : { key:'cafe',       color:'#7c40ff' },   // violet
    'Bars / pubs': { key:'bar',        color:'#00b894' },   // vert
    'Magasins'   : { key:'shop',       color:'#0099e5', isShop:true } // bleu
  };
  
  const radiusAt = z => Math.max(2, 0.8 * (z - 7));

  fetch(`geojson_europe/${file}`)
  .then(r => r.json())
  .then(data => {
    const layer = L.geoJSON(data, {
      // ... options de style ...
    }).addTo(map);
    if (layer.getBounds().isValid()) {
      map.fitBounds(layer.getBounds(), {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [320, 50] // ajuste cette valeur selon la largeur de ta sidebar
      });
    }
    openProjectInfo(window.infosMap[id], shortName);
    openSidebarForProject(id, shortName);
  })
  .catch(err => console.error(`Erreur chargement ${file} :`, err));

  map.on('zoomend', () => updateCircleSize(map.getZoom()));
  function updateCircleSize(z){
    Object.values(overlayLayers).forEach(o=>{
      o.layer?.eachLayer?.(l=>{
        if (l instanceof L.CircleMarker) l.setRadius(radiusAt(z));
      });
    });
  }

  // =============================
  // CONSTRUCTION DE LA SIDEBAR
  // =============================
  function buildSidebar(){
    const old = document.querySelector('.sk-sidebar.leaflet-control');
    if (old) old.remove();

    const sideCtl = L.control({ position:'topright' });
    sideCtl.onAdd = () => {
      const c = L.DomUtil.create('div','sk-sidebar leaflet-control');
      Object.assign(c.style,{
        background:'#fff',padding:'10px',maxHeight:'320px',
        overflowY:'auto',fontSize:'.9rem',display:'none'
      });

      c.innerHTML = '<strong>Fonds de carte</strong><br>';
      Object.keys(baseLayers).forEach((n,i)=>{
        c.innerHTML += `<label><input type="radio" name="base" value="${n}" ${i===0?'checked':''}/> ${n}</label><br>`;
      });

      c.innerHTML += '<br><strong>Données</strong><br>';
      Object.entries(overlayLayers).forEach(([n,o])=>{
        const bullet = o.color ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${o.color};margin-right:4px;"></span>` : '';
        c.innerHTML += `<label><input type="checkbox" data-ov="${n}"/> ${bullet}${n}</label><br>`;
      });

      c.innerHTML += `
        <hr><strong>Transparence</strong><br>
        <div style="display:flex;align-items:center;margin-bottom:4px">
          <span style="display:inline-block;width:110px">Polygone projet</span>
          <input id="poly-op" type="range" min="0" max="1" step="0.05" value="0.8"
                 style="flex:1;accent-color:#888">
        </div>
        <div style="display:flex;align-items:center">
          <span style="display:inline-block;width:110px">Données</span>
          <input id="data-op" type="range" min="0" max="1" step="0.05" value="1"
                 style="flex:1;accent-color:#888">
        </div>
      `;
      c.querySelector('#poly-op').addEventListener('input', applyOpacity);
      c.querySelector('#data-op').addEventListener('input', applyOpacity);

      return c;
    };
    sideCtl.addTo(map);

    if (!document.querySelector('.sk-toggle-layers')){
      const toggleBtn = L.control({ position:'topright' });
      toggleBtn.onAdd = () => {
        const b = L.DomUtil.create('button','sk-toggle-layers');
        b.textContent = '☰';
        Object.assign(b.style,{
          width:'40px',height:'40px',margin:'5px',
          background:'#eee',border:'2px solid #666',
          borderRadius:'6px',cursor:'pointer',fontSize:'20px',lineHeight:'34px'
        });
        L.DomEvent.disableClickPropagation(b);
        b.onclick = () => {
          const p = document.querySelector('.sk-sidebar.leaflet-control');
          if (p) p.style.display = (p.style.display === 'none' ? 'block' : 'none');
        };
        return b;
      };
      toggleBtn.addTo(map);
    }
  }

  // =============================
  // APPLICATION DE L’OPACITÉ
  // =============================
  function applyOpacity(){
    const polyVal = parseFloat(document.getElementById('poly-op')?.value || 1);
    const dataVal = parseFloat(document.getElementById('data-op')?.value || 1);

    map.eachLayer(l=>{
      if (l instanceof L.Path && !(l instanceof L.CircleMarker) && l.feature){
        l.setStyle?.({ fillOpacity:polyVal, opacity:polyVal });
      }
    });

    Object.values(overlayLayers).forEach(o=>{
      if (o.layer?.setOpacity) o.layer.setOpacity(dataVal);
      else o.layer?.eachLayer?.(l=>{
        if (l instanceof L.CircleMarker) l.setStyle({ fillOpacity:dataVal, opacity:dataVal });
      });
    });
  }

  // =============================
  // SÉLECTEURS DE FONDS ET COUCHES
  // =============================
  document.addEventListener('change', e=>{
    const t=e.target;
    if (t.name==='base'){
      Object.values(baseLayers).forEach(l=>map.removeLayer(l));
      baseLayers[t.value].addTo(map);
    }
    if (t.dataset.ov){
      const o=overlayLayers[t.dataset.ov]; if(!o)return;
      if(t.checked){
        map.addLayer(o.layer);
        if(t.dataset.ov==='Zones à bâtir') bauzonenLegend.addTo(map);
        if(t.dataset.ov==='Affectation du sol') landuseLegend.addTo(map);
      }else{
        map.removeLayer(o.layer);
        if(t.dataset.ov==='Zones à bâtir') map.removeControl(bauzonenLegend);
        if(t.dataset.ov==='Affectation du sol') map.removeControl(landuseLegend);
      }
    }
  });

  // =============================
  // TOOLTIP POUR POI
  // =============================
  function poiTip(t={}){
    const n=t.name||'(sans nom)'; const st=t['addr:street']||''; const num=t['addr:housenumber']||'';
    return st ? `${n} – ${st}${num ? ' '+num : ''}` : n;
  }

    // Ajoute l'échelle
  L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);


  // =============================
  // RETOURNE LA CARTE
  // =============================
  return map;
}
