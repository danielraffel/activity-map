const map = L.map('map', { zoomControl: false }).setView([37.7749, -122.4194], 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

const state = { points: [], shape: [], markers: [], line: null, distanceMarkers: [], history: [], redo: [] };
let routeRequestId = 0;
const $ = id => document.getElementById(id);
const message = (text, error = false) => { $('message').textContent = text; $('message').classList.toggle('error', error); };
const setLoading = value => { $('loading').hidden = !value; };
const km = m => `${(m / 1000).toFixed(m > 10000 ? 1 : 2)} km`;

function saveHistory() { state.history.push(state.points.map(p => ({ lat: p.lat, lng: p.lng }))); state.redo = []; if (state.history.length > 30) state.history.shift(); updateHistoryButtons(); }
function updateHistoryButtons() { $('undoButton').disabled = state.history.length < 2; $('redoButton').disabled = state.redo.length === 0; }
function syncDisplay() { if (state.line) state.line.setStyle({ opacity: $('showRoutePath').checked ? .9 : 0 }); state.distanceMarkers.forEach(m => m.setOpacity($('showDistanceMarkers').checked ? 1 : 0)); }
function updateStats() { $('stops').textContent = state.points.length; $('distance').textContent = state.shape.length > 1 ? km(distance(state.shape)) : '—'; $('clearButton').disabled = state.points.length === 0; $('exportButton').disabled = state.shape.length < 2; $('saveButton').disabled = state.shape.length < 2; $('loadButton').disabled = !localStorage.getItem('activity-map.savedRoute'); updateHistoryButtons(); syncDisplay(); }
function distance(coords) { let total = 0; for (let i=1;i<coords.length;i++) total += L.latLng(coords[i-1]).distanceTo(L.latLng(coords[i])); return total; }
function renderPointList() { const box=$('pointList'); if(!state.points.length){box.hidden=true;box.innerHTML='';return;} box.hidden=false; box.innerHTML=state.points.map((p,i)=>{const label=i===0?'Start':i===state.points.length-1&&state.points.length>1?'End':`Waypoint ${i}`; return `<div class="point-row"><span class="point-badge">${i===0?'●':i===state.points.length-1&&state.points.length>1?'◆':i}</span><input aria-label="${label}" value="${label}" readonly><button type="button" data-remove-point="${i}" aria-label="Remove ${label}">×</button></div>`}).join(''); }
function redrawMarkers() {
  renderPointList();
  state.markers.forEach(m => map.removeLayer(m)); state.markers = state.points.map((p, i) => {
    const marker = L.marker(p, { draggable: true, icon: L.divIcon({ className:'', html:`<div class="route-marker" style="width:20px;height:20px"><span style="position:absolute;color:white;font:700 10px system-ui;transform:translate(5px,1px)">${i+1}</span></div>`, iconSize:[20,20], iconAnchor:[10,10] }) }).addTo(map);
    marker.on('dragend', e => { const ll=e.target.getLatLng(); state.points[i]={lat:ll.lat,lng:ll.lng}; saveHistory(); route(); }); return marker;
  });
}
function drawShape(coords) { state.shape = coords; if (state.line) map.removeLayer(state.line); state.distanceMarkers.forEach(m => map.removeLayer(m)); state.distanceMarkers=[]; state.line = coords.length > 1 ? L.polyline(coords, { color:'#d85b38', weight:5, opacity:.9, lineCap:'round', lineJoin:'round' }).addTo(map) : null; if (coords.length > 1) { let acc=0; for(let i=1;i<coords.length;i++){ acc += L.latLng(coords[i-1]).distanceTo(L.latLng(coords[i])); if(acc>1000){ const m=L.circleMarker(coords[i],{radius:4,color:'#18201c',weight:1,fillColor:'#fbfaf6',fillOpacity:.95}); m.bindTooltip(`${(acc/1000).toFixed(0)} km`,{permanent:true,direction:'top',className:'distance-label'}); m.addTo(map); state.distanceMarkers.push(m); acc=0; } } } updateStats(); }
function addPoint(ll) { state.points.push({lat:ll.lat,lng:ll.lng}); saveHistory(); redrawMarkers(); route(); }
async function route() {
  const requestId = ++routeRequestId;
  if ($('manualMode').checked) { drawShape(state.points); message(state.points.length > 1 ? 'Manual route ready. Drag a point to reshape it.' : 'Manual mode: click the map to add points.'); return; }
  if (state.points.length < 2) { drawShape(state.points); message(state.points.length ? 'Add another point to find a bike-friendly route.' : 'Click the map to begin.'); return; }
  setLoading(true); message('');
  try {
    const locations = state.points.map(p => ({ lat:p.lat, lon:p.lng }));
    const bikeType = $('bikeType').value;
    const surface = $('surfacePreference').value; const hills = $('hillPreference').value; const bias = $('routeBias').value; const costing_options = { bicycle_type: bikeType, use_roads: $('bikeLanes').checked ? 0.15 : 0.5, avoid_bad_surfaces: surface === 'paved' || bikeType === 'Road', use_hills: hills === 'avoid' ? 0.1 : hills === 'climb' ? 0.9 : 0.5, shortest: bias === 'direct' };
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({locations,costing:'bicycle',costing_options,units:'kilometers',shape_format:'polyline6',directions_options:{units:'kilometers'}}) });
    if (!res.ok) throw new Error(`Routing service returned ${res.status}`);
    const data = await res.json(); if (!data.trip?.legs?.length) throw new Error('No route found');
    if (requestId !== routeRequestId) return;
    const coords = []; data.trip.legs.forEach(leg => { const decoded = decodePolyline(leg.shape, 6); if (coords.length) decoded.shift(); coords.push(...decoded); });
    drawShape(coords); message('Bike route ready. Drag a point to reshape it.');
  } catch (e) { if (requestId === routeRequestId) { drawShape([]); message('Could not find a bicycle route for these points. Adjust a stop or try again.', true); } }
  finally { setLoading(false); }
}
function decodePolyline(str, precision) { let index=0, lat=0, lng=0, factor=10**precision, out=[]; while(index<str.length){ let result=0,shift=0,b; do{b=str.charCodeAt(index++)-63;result|=(b&31)<<shift;shift+=5}while(b>=32);lat += result&1 ? ~(result>>1) : result>>1; result=0;shift=0; do{b=str.charCodeAt(index++)-63;result|=(b&31)<<shift;shift+=5}while(b>=32);lng += result&1 ? ~(result>>1) : result>>1; out.push([lat/factor,lng/factor]); } return out; }
function gpx() { const pts=state.shape; const body=pts.map(([lat,lon])=>`    <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}"></trkpt>`).join('\n'); return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Activity Map" xmlns="http://www.topografix.com/GPX/1/1"><metadata><name>Activity Map route</name></metadata><trk><name>Activity Map route</name><trkseg>\n${body}\n</trkseg></trk></gpx>`; }
function exportGPX() { const blob=new Blob([gpx()],{type:'application/gpx+xml'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='activity-map-route.gpx'; a.click(); URL.revokeObjectURL(a.href); message('GPX downloaded.'); }
function parseGPX(text) { const xml=new DOMParser().parseFromString(text,'application/xml'); const pts=[...xml.querySelectorAll('trkpt,rtept')].map(n=>({lat:+n.getAttribute('lat'),lng:+n.getAttribute('lon')})).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)); if(pts.length<2) throw new Error('No route points found'); state.points=pts; state.history=[pts.map(p=>({...p}))]; state.redo=[]; redrawMarkers(); drawShape(pts); map.fitBounds(L.latLngBounds(pts),{padding:[35,35]}); route(); message('Imported GPX. Drag a point to edit it.'); }
map.on('click', e => addPoint(e.latlng));
$('pointList').addEventListener('click', e => { const button=e.target.closest('[data-remove-point]'); if(!button)return; const index=+button.dataset.removePoint; state.points.splice(index,1); saveHistory(); redrawMarkers(); route(); });
$('clearButton').onclick=()=>{state.points=[];saveHistory();redrawMarkers();drawShape([]);message('Route cleared. Click the map to begin.')};
$('undoButton').onclick=()=>{if(!state.history.length)return; state.redo.push(state.history.pop()); const previous=state.history[state.history.length-1]||[]; state.points=previous.map(p=>({...p})); redrawMarkers(); route(); updateHistoryButtons()};
$('redoButton').onclick=()=>{if(!state.redo.length)return;const next=state.redo.pop();state.history.push(next.map(p=>({...p})));state.points=next.map(p=>({...p}));redrawMarkers();route();updateHistoryButtons()};
$('exportButton').onclick=exportGPX;
$('importButton').onclick=()=>$('fileInput').click();
$('fileInput').onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=()=>{try{parseGPX(r.result)}catch(err){message(err.message,true)}};r.readAsText(f)}};
async function search(){const q=$('searchInput').value.trim();if(!q)return; const coordinate=/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(q); if(coordinate){const lat=+coordinate[1],lng=+coordinate[2]; if(lat>=-90&&lat<=90&&lng>=-180&&lng<=180){map.setView([lat,lng],15); addPoint({lat,lng}); $('searchInput').value=''; message(`Added coordinate ${lat.toFixed(5)}, ${lng.toFixed(5)}.`); return;}} message('Searching…');try{const res=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`,{headers:{Accept:'application/json'}});const data=await res.json();const box=$('searchResults');box.innerHTML='';box.hidden=!data.length;data.forEach(item=>{const b=document.createElement('button');b.className='search-result';b.innerHTML=`${item.display_name.split(',')[0]}<small>${item.display_name}</small>`;b.onclick=()=>{map.setView([+item.lat,+item.lon],14);box.hidden=true;message('Click the map to add a route point.');};box.appendChild(b)});if(!data.length)message('No places found.',true)}catch(e){message('Place search is unavailable right now.',true)}}
$('routeBias').onchange=()=>{if(state.points.length>1)route()}; $('bikeType').onchange=()=>{if(state.points.length>1)route()}; $('bikeLanes').onchange=()=>{if(state.points.length>1)route()}; $('surfacePreference').onchange=()=>{if(state.points.length>1)route()}; $('hillPreference').onchange=()=>{if(state.points.length>1)route()}; $('manualMode').onchange=()=>{if(state.points.length>0)route()}; $('showRoutePath').onchange=syncDisplay; $('showDistanceMarkers').onchange=syncDisplay;
$('searchButton').onclick=search;$('searchInput').onkeydown=e=>{if(e.key==='Enter')search()};

function saveRoute(){if(state.shape.length<2)return; localStorage.setItem('activity-map.savedRoute',JSON.stringify({points:state.points,shape:state.shape,profile:$('bikeType').value,savedAt:new Date().toISOString()})); updateStats(); message('Route saved in this browser.');}
function loadRoute(){const raw=localStorage.getItem('activity-map.savedRoute');if(!raw)return;const data=JSON.parse(raw);state.points=data.points||[];state.history=[state.points.map(p=>({...p}))];state.redo=[];if(data.profile)$('bikeType').value=data.profile;redrawMarkers();drawShape(data.shape||state.points);if(state.shape.length>1)map.fitBounds(L.latLngBounds(state.shape),{padding:[35,35]});message('Saved route loaded.');}
$('saveButton').onclick=saveRoute; $('loadButton').onclick=loadRoute; updateStats();
