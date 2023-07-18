export function delay(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

export function logAllEntities(scene) {
  const entityArray = [];
  scene.children.each(entity => {
    entityArray.push(entity);
  });
  console.log(entityArray);
}

export function scrollBackground(scene){
  if (scene.bg.y > scene.canvas.height) {
      repositionBG(scene.bg)
  } else if (scene.bg2.y > scene.canvas.height) {
      repositionBG(scene.bg2)
  }

  function repositionBG(background) {
      background.y = 5 - background.body.height - scene.bgBuffer
  }
}