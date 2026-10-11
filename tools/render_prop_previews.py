import bpy,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]/'assets/hongqiao_props'
for asset in sys.argv[sys.argv.index('--')+1:]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(root/asset/(asset+'.glb')))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box]
    low=Vector([min(v[i] for v in points) for i in range(3)])
    high=Vector([max(v[i] for v in points) for i in range(3)])
    center=(low+high)/2
    radius=(high-low).length/2
    # Camera framed by the complete imported geometry, not the cropped API render.
    camera_data=bpy.data.cameras.new('PreviewCamera')
    camera=bpy.data.objects.new('PreviewCamera',camera_data);bpy.context.collection.objects.link(camera)
    camera.location=center+Vector((1.5,-2.4,2.5))*radius
    camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    camera_data.type='ORTHO';camera_data.ortho_scale=radius*3.6
    scene=bpy.context.scene;scene.camera=camera
    scene.world=bpy.data.worlds.new('PreviewWorld');scene.world.use_nodes=True
    scene.world.node_tree.nodes['Background'].inputs[0].default_value=(0.18,0.18,0.18,1)
    scene.world.node_tree.nodes['Background'].inputs[1].default_value=0.7
    for name,vec,power,size in [('Key',(-2,-3,5),450,3),('Fill',(3,1,2),220,4)]:
        data=bpy.data.lights.new(name,'AREA');data.energy=power*radius*radius;data.shape='DISK';data.size=size*radius
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj)
        obj.location=center+Vector(vec)*radius;obj.rotation_euler=(center-obj.location).to_track_quat('-Z','Y').to_euler()
    scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
    scene.render.resolution_x=900;scene.render.resolution_y=600;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.filepath=str(root/asset/'preview_full.png')
    bpy.ops.render.render(write_still=True)
    print('PREVIEW_WRITTEN',asset,flush=True)
