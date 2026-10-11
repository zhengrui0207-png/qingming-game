# D区场景灰盒 1.0.0

只交场景覆盖层，尚未装配到正式第二关。世界轴沿用既有Blender输出，地面标高0.94米，临水边界z=-18。原图仅用于外形、相邻关系与遮挡参考，不换算现实距离。

## 接入

```js
import {create} from './src/chapter2/scene/scene.js';
const d = create({scene, world:legacyWorld, city:legacyCity});
// 可复用资产缓冲由主控加载/持有，不在模块dispose时销毁共享源资产。
// import {mountReusableAssets} from ./src/chapter2/scene/asset-mounts.js
// mountReusableAssets(d.slots, loadedStreetLifeRoot);
// 00/10以d.world作为第二关运行期碰撞世界，保留原moveActor和相机。
// 模块不会修改传入的world，也不会读取/写入任何存档。
// d.slots用于美术挂接；不要把整个d-graybox.glb叠到d.root上重复渲染。
// registry + onInteract为可选挂接，具体业务行为由主控/玩法模块接入。
// 不要同时由场景与玩法模块注册同一anchor ID。
// 离开且恢复旧世界时：
d.dispose(); // 幂等；恢复原city几何，注销本模块交互并释放自建几何与材质
```

单一实例所有者：同一city不能同时创建多个D覆盖模块。地面无需改造：既有bank已是.94，新区域支持面另列layout.supportSurfaces供主控查询；不覆盖world.js，不把屋顶当支持面。新增几何的底部、碰撞高度与模型挂接都以此标高为准。

anchors.json.position为交互目标的贴地坐标，不是人物中心高度；standingPosition为推荐玩家接近位置，两者不可混用。四位人物为灰盒胶囊；不挪用或改名第一关角色。钓点lookAt/castTarget在水中，钓鱼角色应仍站在岸上。钓点A落点[-25,.08,-12]、B落点[-52,.08,-9]避开三艘泊舟的保守包围盒，主控接动态舟群后须再做视线/落点核验。entry连接D入口，safe_return仍在D；返回C须由主控使用合同安全点[0,.94,35]。

## 所有权与替换

D局部x[-81,-21]、z[-60,-18]。只删除原碰撞体包围盒完全在该矩形内者；跨边界碰撞保留。GLB静态世界已按材质合并，用对象名隐藏铺子不可行。applyDMask克隆几何，只移除全部顶点在D内的三角形；ground/path不处理；dispose恢复相同原几何引用。原GLB、world.json、原角色/故事/运动模块无修改。

入口附近跨界屋宇保留，已为safe_return绕开其碰撞。跨界残存面与旧路面是灰盒限制；不把局部裁剪当正式美术还原。生产整合须同步过滤D内旧店铺与群众装配，避免重复柜台或无碰撞旧居民；本模块没有接管旧运行时。D外铺面与所有C对象保留。

S01归C，只回望现有桥。S12归E，仅assetSlot/cityGate=[-83,.94,-43]建议挂接位，E主体/门洞从主控共享；本副本没有可用城门，未另造假城门。禁止以该点宣布已进入E。大型彩楼欢门不在D。

## 美术接口

- scene.root命名chapter2/D/graybox；结构对象由layout.structures稳定id标注。
- slots.boats三个子组：分别绑定静泊舟；当前复用street-life.glb/ferry（带现有篷盖，不另加水平板）。水面/缆绳细节正式阶段复核。
- slots.repair、coveredCart、traffic：复用street-life/cart；ox来自scenery/ox。S10/S11分别保持敞载/有篷外形，灰盒不核定古代车名。
- slots.cityGate：E所有，缺资产时保持空组。正式门的朝向、体量由E/主控确定，不能依此扩建E。
- traffic.path只在layout中配置速度0.45米/秒、两端停留3秒，5米短线；当前静态摆位且预留整个扫掠碰撞包络，主控后续动态控制时保留绕行通路。没有伪称车马动画完成。
- S04敞面瓦屋、S05错落瓦屋/空白幌子、S06低屋树下坐人、S07棚摊伞盖、S08箱笼队列、S09木架挑担都是简形，身份与经营内容属于玩法虚构，未将原图招牌杜撰成店名。

## 独立预览

在本副本执行npm run dev -- --port 5282 --strictPort，然后访问/chapter2-scene-preview.html。

预览只在自己的页面监听键盘与指针，用原moveActor，速度2.7/5.2、半径.32、相机偏航/俯仰和屋宇遮挡采样沿用既有行为。生产scene模块无window输入监听。预览角色使用胶囊替身，不改阿青正式资产/输入/相机。连续实走按钮以RAF时间推进，包含入口→两钓点→人物→修缮→铺面→交付/终点及每条反向回访；不调用setActor瞬移。下拉定位仅供取景和诊断，与实走证据分别记录。

证据见verification.json、截图、测试日志、painting-reference.png及comparison.svg。场景灰盒通过不代表正式美术、第二关整合或真人首次试玩通过。

## 2026-10-04 D区画面版本

既有灰盒合同与支持面保持；本轮已在独立预览挂接详细几何/纹理、真实角色和D专用光照。结果及正式装配限制见[画面交付](visuals/handoff.md)。独立美术预览通过不等于整关main或真人试玩通过。
