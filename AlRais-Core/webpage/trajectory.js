/* =========================================================
   Trajectory — hero layer activation choreography
   ========================================================= */

(function(){
  'use strict';

  function bindTower(){
    const layers = document.querySelectorAll('#tower .t-layer');
    if (!layers.length) return;

    let i = 0;
    function cycle(){
      layers.forEach(l => l.classList.remove('active'));
      const cur = layers[i % layers.length];
      cur.classList.add('active');
      i++;
    }
    // Match packet travel: ~7.5s round trip, 6 layers → ~1.25s per layer.
    setInterval(cycle, 1250);
    cycle();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', bindTower);
  } else {
    bindTower();
  }
})();
