import bpy, math, json
from pathlib import Path
from mathutils import Vector
ROOT=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game')
DREAM=ROOT/'.dream-loop/chapter2-2026-10-02'
OUT=ROOT/'public/assets/chapter2/scene/detail-v1'
bpy.ops.wm.open_mainfile(filepath=str(DREAM/'d-detail.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.cycles.bake_type='DIFFUSE'
scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.use_pass_color=False;scene.render.bake.margin=8
scene.cycles.max_bounces=4;scene.cycles.diffuse_bounces=3
world=bpy.data.worlds.new('D cool spring sky');world.use_nodes=True;world.node_tree.nodes['Background'].inputs['Color'].default_value=(.38,.53,.70,1);world.node_tree.nodes['Background'].inputs['Strength'].default_value=.65;scene.world=world
light=bpy.data.lights.new('Warm daylight','SUN');light.energy=2.4;light.color=(1,.86,.65);light.angle=math.radians(2.0);obj=bpy.data.objects.new('Warm daylight',light);scene.collection.objects.link(obj)
# Browser daylight direction x+36,y-34,z+21 maps to Blender x+36,y-21,z-34.
obj.rotation_euler=Vector((36,-21,-34)).to_track_quat('-Z','Y').to_euler()
# Millimetre lime flakes are pigments/relief, not black bake occluders.
flake_alpha={}
for m in bpy.data.materials:
 if m.name.startswith('D_LimeSpall'):
  flake_alpha[m]=m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value
  m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value=0.
# Ground bounce and static contact occlusion, not a gameplay support surface.
bpy.ops.mesh.primitive_plane_add(size=1,location=(-51,38,.945));ground=bpy.context.object;ground.name='bake-only earth';ground.scale=(60,44,1)
mat=bpy.data.materials.new('warm earth bounce');mat.diffuse_color=(.35,.26,.17,1);mat.use_nodes=True;mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.35,.26,.17,1);ground.data.materials.append(mat)
# Existing geometry albedo supplies physically plausible reflected color.
selected=[o for o in scene.objects if o.type=='MESH' and o.name.startswith(('s04','s05_house','s06_low','s07_stall','s07_umbrella'))]
scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=-2
reports=[]
for target in selected:
 bpy.ops.object.select_all(action='DESELECT');target.select_set(True);bpy.context.view_layer.objects.active=target
 # Preserve actual local occlusion for joinery/utensils. Large surfaces already
 # receive Cycles diffuse and must not have occlusion applied a second time.
 for a in target.data.color_attributes:
  for poly in target.data.polygons:
   material=target.data.materials[poly.material_index].name
   if material.startswith(('D_LimePlaster','D_Linen')):
    for li in poly.loop_indices:a.data[li].color=(1,1,1,1)
 target.data.uv_layers.new(name='DaylightUV');target.data.uv_layers.active=target.data.uv_layers['DaylightUV']
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.004);bpy.ops.object.mode_set(mode='OBJECT')
 # Clone materials per object so each active bake target is independent.
 for i,material in enumerate(target.data.materials):
  copy=material.copy();target.data.materials[i]=copy;copy.name=material.name+'__'+target.name
 img=bpy.data.images.new('daylight-'+target.name,width=1024,height=1024,float_buffer=True);img.colorspace_settings.name='Linear Rec.709'
 for material in target.data.materials:
  node=material.node_tree.nodes.new('ShaderNodeTexImage');node.image=img;material.node_tree.nodes.active=node
 bpy.ops.object.bake(type='DIFFUSE')
 # Store irradiance divided by four in an sRGB PNG; browser restores scale.
 pixels=list(img.pixels);pixels=[v*.25 if i%4!=3 else 1.0 for i,v in enumerate(pixels)];img.pixels[:]=pixels
 img.file_format='PNG';img.filepath_raw=str(OUT/('daylight-'+target.name+'.png'));img.save()
 target.data.uv_layers.active=target.data.uv_layers['SurfaceUV'];target.data.uv_layers['SurfaceUV'].active_render=True
 reports.append({'object':target.name,'file':Path(img.filepath_raw).name,'size':[1024,1024],'irradianceScale':4,'uv':'DaylightUV'})
# Restore flake opacity on clones and untouched meshes before runtime export.
for m in bpy.data.materials:
 if m.name.startswith('D_LimeSpall'):m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value=1.
# Preserve runtime material identities and remove lightmap bake helpers.
for target in selected:
 for m in target.data.materials:
  m.name=m.name.split('__')[0]
  for node in list(m.node_tree.nodes):
   if node.type=='TEX_IMAGE' and node.image and node.image.name.startswith('daylight-'):m.node_tree.nodes.remove(node)
bpy.data.objects.remove(ground,do_unlink=True);bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=str(DREAM/'d-detail-daylight.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
 if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'d-detail-daylight.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='AUTO',export_animations=False,export_vertex_color='ACTIVE')
(OUT/'daylight-bake.json').write_text(json.dumps({'method':'Cycles diffuse direct+indirect irradiance, without albedo','samples':32,'sunDirectionWorld':[36,-34,21],'sunAngularSizeDegrees':2.0,'worldStrength':.65,'imageScale':4,'maps':reports,'dynamicCharacters':'retain real-time lights','scope':'standalone preview opt-in only, not accepted first-level lighting'},ensure_ascii=False,indent=2))
