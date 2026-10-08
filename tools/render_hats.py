"""Stand-in product renders for The Cap Bar demo (Blender 4.2, Cycles).

  blender -b -P tools/render_hats.py -- [--only name1,name2] [--samples 96] [--res 1040x715] [--out DIR]

Produces studio-style shots of a structured 6-panel snapback / trucker / denim dad cap /
cuffed beanie on a dark backdrop. These are placeholders until the owner's real photos arrive.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
TEX = os.path.join(HERE, "textures")
argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default
ONLY = [s for s in arg("--only", "").split(",") if s]
SAMPLES = int(arg("--samples", "96"))
RX, RY = (int(v) for v in arg("--res", "1040x715").split("x"))
OUT = arg("--out", os.path.join(os.path.dirname(HERE), "..", "work", "renders"))
os.makedirs(OUT, exist_ok=True)

def srgb(h):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (1.0,)

# ------------------------------------------------------------------ scene
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.render.resolution_x, sc.render.resolution_y = RX, RY
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "AgX"
    try: sc.view_settings.look = "AgX - Medium High Contrast"
    except Exception: pass
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.012, 0.011, 0.010, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    return sc

def studio(sc, target=Vector((0, -0.25, 0.42)), cam_az=-38, cam_el=16, dist=7.2, lens=85):
    # curved backdrop (cyclorama)
    bm = bmesh.new()
    prof = []
    for i in range(25):
        t = i / 24
        a = t * math.pi / 2
        r = 2.5
        prof.append((0, 4 - r + r * math.sin(a) if False else 0, 0))
    bm.free()
    verts, faces = [], []
    N = 40; W = 30
    for i in range(N + 1):
        t = i / N
        if t < 0.5:
            y, z = -12 + t / 0.5 * 12, 0.0          # floor
        else:
            a = (t - 0.5) / 0.5 * math.pi / 2
            r = 4.0
            y, z = r * math.sin(a), r * (1 - math.cos(a))
            if t == 1.0: z += 0
        verts += [(-W / 2, y + 2.5, z - 0.0), (W / 2, y + 2.5, z)]
    # extend wall up
    verts += [(-W / 2, 6.5, 14), (W / 2, 6.5, 14)]
    rows = len(verts) // 2
    for i in range(rows - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    me = bpy.data.meshes.new("backdrop"); me.from_pydata(verts, [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new("backdrop", me); sc.collection.objects.link(ob)
    ob.location.z = -0.03
    m = bpy.data.materials.new("backdrop"); m.use_nodes = True
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = srgb("#151311")
    bs.inputs["Roughness"].default_value = 0.9
    ob.data.materials.append(m)
    # lights
    def area(name, loc, power, size, color=(1, 1, 1), size_y=None):
        L = bpy.data.lights.new(name, "AREA"); L.energy = power; L.size = size
        if size_y: L.shape = "RECTANGLE"; L.size_y = size_y
        L.color = color
        o = bpy.data.objects.new(name, L); sc.collection.objects.link(o); o.location = loc
        d = (target - Vector(loc)).normalized()
        o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
        return o
    area("key", (-4.5, -5.5, 5.5), 650, 4.0, (1.0, 0.93, 0.84))
    area("fill", (5.5, -4.0, 2.0), 160, 5.0, (0.92, 0.95, 1.0))
    area("rim", (3.5, 4.5, 4.0), 900, 2.0, (1.0, 0.96, 0.9), size_y=5)
    area("rim2", (-4.0, 4.0, 3.0), 600, 2.0, (1.0, 0.92, 0.82), size_y=4)
    area("top", (0, -0.5, 7.5), 90, 4.0)
    # backdrop glow behind the hat (warm pool, like the pendant lights on the site)
    sp = bpy.data.lights.new("pool", "SPOT"); sp.energy = 900; sp.spot_size = math.radians(40); sp.spot_blend = 1.0
    sp.color = (1.0, 0.78, 0.5)
    spo = bpy.data.objects.new("pool", sp); sc.collection.objects.link(spo)
    spo.location = (0, -3, 6); d = (Vector((0, 5.5, 2.5)) - spo.location).normalized()
    spo.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    # camera
    cam = bpy.data.cameras.new("cam"); cam.lens = lens
    co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
    az, el = math.radians(cam_az), math.radians(cam_el)
    dirv = Vector((math.sin(az), -math.cos(az) * math.cos(el), math.sin(el))).normalized()
    co.location = target + dirv * dist
    co.rotation_euler = (target - co.location).to_track_quat("-Z", "Y").to_euler()
    cam.dof.use_dof = True; cam.dof.focus_distance = dist; cam.dof.aperture_fstop = 8
    return co

# --------------------------------------------------------------- materials
class NB:
    """tiny node-building helper"""
    def __init__(self, name):
        self.m = bpy.data.materials.new(name); self.m.use_nodes = True
        self.t = self.m.node_tree; self.n = self.t.nodes; self.l = self.t.links
        self.bsdf = self.n["Principled BSDF"]
    def node(self, kind, **props):
        nd = self.n.new(kind)
        for k, v in props.items(): setattr(nd, k, v)
        return nd
    def link(self, a, b): self.l.new(a, b)
    def math(self, op, a, b=None, clamp=False):
        nd = self.node("ShaderNodeMath", operation=op); nd.use_clamp = clamp
        for i, v in enumerate([a, b]):
            if v is None: continue
            if isinstance(v, (int, float)): nd.inputs[i].default_value = v
            else: self.link(v, nd.inputs[i])
        return nd.outputs[0]
    def mix(self, fac, a, b):
        nd = self.node("ShaderNodeMix", data_type="RGBA")
        for idx, v in [(0, fac), (6, a), (7, b)]:
            if isinstance(v, (int, float)): nd.inputs[idx].default_value = v
            elif isinstance(v, tuple): nd.inputs[idx].default_value = v
            else: self.link(v, nd.inputs[idx])
        return nd.outputs[2]
    def uv(self, name="UVMap"):
        nd = self.node("ShaderNodeUVMap"); nd.uv_map = name
        return nd.outputs[0]
    def sep(self, vec):
        nd = self.node("ShaderNodeSeparateXYZ"); self.link(vec, nd.inputs[0]); return nd.outputs
    def comb(self, x, y, z=0.0):
        nd = self.node("ShaderNodeCombineXYZ")
        for i, v in enumerate([x, y, z]):
            if isinstance(v, (int, float)): nd.inputs[i].default_value = v
            else: self.link(v, nd.inputs[i])
        return nd.outputs[0]
    def bump(self, height, strength, distance=0.02, normal=None):
        b = self.node("ShaderNodeBump"); b.inputs["Strength"].default_value = strength
        b.inputs["Distance"].default_value = distance
        self.link(height, b.inputs["Height"])
        if normal is not None: self.link(normal, b.inputs["Normal"])
        return b.outputs[0]
    def noise(self, vec, scale, detail=2.0):
        nd = self.node("ShaderNodeTexNoise"); nd.inputs["Scale"].default_value = scale; nd.inputs["Detail"].default_value = detail
        if vec is not None: self.link(vec, nd.inputs["Vector"])
        return nd.outputs["Fac"]
    def wave(self, vec, scale, direction="X", profile="SIN", distortion=0.0):
        nd = self.node("ShaderNodeTexWave", wave_type="BANDS", bands_direction=direction, wave_profile=profile)
        nd.inputs["Scale"].default_value = scale; nd.inputs["Distortion"].default_value = distortion
        if vec is not None: self.link(vec, nd.inputs["Vector"])
        return nd.outputs["Fac"]
    def image(self, path, vec, ext="CLIP"):
        nd = self.node("ShaderNodeTexImage"); nd.image = bpy.data.images.load(path, check_existing=True)
        nd.extension = ext; nd.interpolation = "Cubic"
        self.link(vec, nd.inputs["Vector"])
        return nd.outputs["Color"], nd.outputs["Alpha"]
    def mapv(self, vec, scale=(1, 1, 1), loc=(0, 0, 0)):
        nd = self.node("ShaderNodeMapping"); nd.inputs["Scale"].default_value = scale; nd.inputs["Location"].default_value = loc
        self.link(vec, nd.inputs["Vector"]); return nd.outputs[0]

def fabric(name, color, kind="twill", patch=None, mesh_region=False, sheen=0.6, rough=0.82):
    """kind: twill | foam | denim | knit | mesh. patch: dict(img, center(u,v), size(w,h), mode, tile)"""
    b = NB(name); bs = b.bsdf
    uvv = b.uv(); U, V, _ = b.sep(uvv)
    obj = b.node("ShaderNodeTexCoord").outputs["Object"]
    base = srgb(color) if isinstance(color, str) else color
    col = base
    height = None
    if kind in ("twill", "foam"):
        fib = b.noise(obj, 260.0, 3.0)
        tw = b.wave(b.mapv(obj, (1, 1, 1)), 95.0 if kind == "twill" else 30.0, "DIAGONAL", "SIN")
        height = b.math("ADD", b.math("MULTIPLY", fib, 0.6), b.math("MULTIPLY", tw, 0.4 if kind == "twill" else 0.1))
        var = b.noise(obj, 6.0, 2.0)
        col = b.mix(b.math("MULTIPLY", var, 0.10), base, tuple(min(1, c * 1.5) for c in base[:3]) + (1,))
        bstr = 0.10 if kind == "twill" else 0.05
    elif kind == "denim":
        tw = b.wave(obj, 140.0, "DIAGONAL", "SIN", 1.5)
        fib = b.noise(obj, 320.0, 3.0)
        wash = b.noise(obj, 3.5, 4.0)
        streak = b.noise(b.mapv(obj, (1, 1, 14)), 9.0, 3.0)
        light = tuple(min(1, c * 2.4 + 0.05) for c in base[:3]) + (1,)
        dark = tuple(c * 0.55 for c in base[:3]) + (1,)
        c1 = b.mix(b.math("MULTIPLY", tw, 0.55), dark, base)
        c2 = b.mix(b.math("POWER", b.math("MULTIPLY", wash, b.math("ADD", streak, 0.4)), 2.2), c1, light)
        col = b.mix(b.math("MULTIPLY", fib, 0.25), c2, light)
        height = b.math("ADD", b.math("MULTIPLY", tw, 0.7), b.math("MULTIPLY", fib, 0.3))
        bstr = 0.22
    elif kind == "knit":
        # rib knit: columns along U, V-stitches along V (UVs are in real length units)
        cols = b.math("MULTIPLY", U, 15.0)
        rows = b.math("MULTIPLY", V, 21.0)
        rib = b.math("ABSOLUTE", b.math("SINE", b.math("MULTIPLY", cols, math.pi)))
        vst = b.math("ABSOLUTE", b.math("SINE", b.math("MULTIPLY", b.math("ADD", rows, b.math("MULTIPLY", b.math("FRACT", cols), 0.5)), math.pi)))
        height = b.math("MULTIPLY", b.math("POWER", rib, 0.6), b.math("ADD", b.math("MULTIPLY", vst, 0.25), 0.75))
        fuzz = b.noise(obj, 180.0, 4.0)
        col = b.mix(b.math("MULTIPLY", b.math("SUBTRACT", 1.0, height), 0.45), base, tuple(c * 0.45 for c in base[:3]) + (1,))
        col = b.mix(b.math("MULTIPLY", fuzz, 0.12), col, tuple(min(1, c * 1.6 + 0.03) for c in base[:3]) + (1,))
        height = b.math("ADD", height, b.math("MULTIPLY", fuzz, 0.25))
        bstr = 0.9; sheen = 1.0; rough = 0.95
    elif kind == "mesh":
        cells = b.node("ShaderNodeTexVoronoi"); cells.inputs["Scale"].default_value = 1.0
        cells.inputs["Randomness"].default_value = 0.0
        b.link(b.comb(b.math("MULTIPLY", U, 26.0), b.math("MULTIPLY", V, 26.0)), cells.inputs["Vector"])
        hole = b.math("LESS_THAN", cells.outputs["Distance"], 0.30)
        col = b.mix(hole, base, tuple(c * 0.12 for c in base[:3]) + (1,))
        height = b.math("SUBTRACT", 1.0, hole)
        bstr = 0.35
    # patch / embroidery overlay
    if patch:
        cu, cv = patch["center"]; w, h = patch["size"]
        pu = b.math("ADD", b.math("DIVIDE", b.math("SUBTRACT", U, cu), w), 0.5)
        pv = b.math("ADD", b.math("DIVIDE", b.math("SUBTRACT", V, cv), h), 0.5)
        if patch.get("tile"):
            pu = b.math("MULTIPLY", pu, patch["tile"][0]); pv = b.math("MULTIPLY", pv, patch["tile"][1])
        pc, pa = b.image(os.path.join(TEX, patch["img"]), b.comb(pu, pv), "REPEAT" if patch.get("tile") else "CLIP")
        if patch.get("tile"):
            # limit pattern to the front panels (|U| < limit) and below the top
            lim = b.math("LESS_THAN", b.math("ABSOLUTE", U), patch["limit_u"])
            limv = b.math("LESS_THAN", V, patch["limit_v"])
            pa = b.math("MULTIPLY", b.math("MULTIPLY", pa, lim), limv)
        thread = b.wave(b.comb(b.math("MULTIPLY", pu, 1.0), b.math("MULTIPLY", pv, 1.0)), 180.0, "DIAGONAL", "SIN")
        col = b.mix(pa, col, pc)
        ph = b.math("ADD", b.math("MULTIPLY", pa, 1.0), b.math("MULTIPLY", b.math("MULTIPLY", thread, pa), 0.35))
        height = b.math("ADD", height, b.math("MULTIPLY", ph, patch.get("puff", 1.5))) if height else ph
        gold = patch.get("metal", 0.0)
        if gold:
            b.link(b.math("MULTIPLY", pa, gold), bs.inputs["Metallic"])
            b.link(b.mix(pa, (rough, rough, rough, 1), (0.42, 0.42, 0.42, 1)), bs.inputs["Roughness"])
    if not isinstance(col, tuple):
        b.link(col, bs.inputs["Base Color"])
    else:
        bs.inputs["Base Color"].default_value = col
    if not (patch and patch.get("metal")):
        bs.inputs["Roughness"].default_value = rough
    bs.inputs["Sheen Weight"].default_value = sheen
    bs.inputs["Sheen Roughness"].default_value = 0.45
    bs.inputs["Specular IOR Level"].default_value = 0.25
    if height is not None:
        b.link(b.bump(height, bstr if not patch else min(0.6, bstr + 0.25), 0.012), bs.inputs["Normal"])
    return b.m

def brim_top_mat(name, color, kind="twill", rows=8, thread="#d8d2c4", start=0.10, dash=110.0):
    """brim top with rows of stitching (UV: x = arc length, y = 0 inner .. 1 outer)"""
    b = NB(name); bs = b.bsdf
    U, V, _ = b.sep(b.uv())
    obj = b.node("ShaderNodeTexCoord").outputs["Object"]
    base = srgb(color)
    if kind == "denim":
        tw = b.wave(obj, 140.0, "DIAGONAL", "SIN", 1.5); wash = b.noise(obj, 3.5, 4.0)
        light = tuple(min(1, c * 2.4 + 0.05) for c in base[:3]) + (1,)
        col = b.mix(b.math("POWER", wash, 2.2), b.mix(b.math("MULTIPLY", tw, 0.55), tuple(c * 0.55 for c in base[:3]) + (1,), base), light)
        h0 = b.math("MULTIPLY", tw, 0.6)
    else:
        fib = b.noise(obj, 260.0, 3.0); tw = b.wave(obj, 95.0, "DIAGONAL", "SIN")
        col = b.mix(b.math("MULTIPLY", b.noise(obj, 6.0), 0.1), base, tuple(min(1, c * 1.5) for c in base[:3]) + (1,))
        h0 = b.math("ADD", b.math("MULTIPLY", fib, 0.6), b.math("MULTIPLY", tw, 0.4))
    # stitch rows parallel to the outer edge
    vv = b.math("DIVIDE", b.math("SUBTRACT", V, start), 1.0 - start)
    f = b.math("FRACT", b.math("MULTIPLY", vv, rows))
    line = b.math("LESS_THAN", b.math("ABSOLUTE", b.math("SUBTRACT", f, 0.5)), 0.06)
    dashm = b.math("LESS_THAN", b.math("FRACT", b.math("MULTIPLY", U, dash)), 0.68)
    inside = b.math("MULTIPLY", b.math("GREATER_THAN", V, start), b.math("LESS_THAN", V, 0.985))
    st = b.math("MULTIPLY", b.math("MULTIPLY", line, dashm), inside)
    col = b.mix(st, col, srgb(thread))
    b.link(col, bs.inputs["Base Color"])
    bs.inputs["Roughness"].default_value = 0.95
    bs.inputs["Sheen Weight"].default_value = 0.08
    bs.inputs["Specular IOR Level"].default_value = 0.08
    groove = b.math("SUBTRACT", b.math("ADD", h0, b.math("MULTIPLY", st, 1.2)), b.math("MULTIPLY", line, 0.5))
    b.link(b.bump(groove, 0.25, 0.01), bs.inputs["Normal"])
    return b.m

def lighten(h, k):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{int(v + (255 - v) * k):02x}" for v in c)

def simple(name, color, rough=0.6, metal=0.0, sheen=0.0):
    b = NB(name); bs = b.bsdf
    bs.inputs["Base Color"].default_value = srgb(color); bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metal; bs.inputs["Sheen Weight"].default_value = sheen
    return b.m

# ----------------------------------------------------------------- geometry
class Crown:
    def __init__(self, a=0.90, b=1.0, H=1.12, p=2.5, front_lift=0.10, s_max=0.985):
        self.a, self.b, self.H, self.p, self.fl, self.smax = a, b, H, p, front_lift, s_max
    def P(self, al, s):
        # al: azimuth, 0 = front (-Y). s in [0, 1]: 0 = rim, 1 = apex
        th = s * math.pi / 2 * self.smax
        e = 2.0 / self.p
        rho = math.cos(th) ** e
        z = self.H * math.sin(th) ** e
        x = self.a * math.sin(al) * rho
        y = -self.b * math.cos(al) * rho
        z *= 1.0 + self.fl * max(-1.0, min(1.0, -y / self.b))
        return Vector((x, y, z))
    def N(self, al, s):
        e = 1e-3
        du = self.P(al + e, s) - self.P(al - e, s)
        dv = self.P(al, min(1, s + e)) - self.P(al, max(0, s - e))
        n = du.cross(dv).normalized()
        return n if n.dot(self.P(al, s) - Vector((0, 0, 0.3))) > 0 else -n
    def build(self, name, mat_fn=None, cutout=None, NA=192, NS=72):
        """mat_fn(al) -> material index ; cutout(al, s) -> True to drop face"""
        verts, uvs = [], []
        als = [-math.pi + 2 * math.pi * i / NA for i in range(NA + 1)]
        ss = [j / NS for j in range(NS + 1)]
        idx = {}
        for i, al in enumerate(als):
            arc = 0.0; prev = None
            for j, s in enumerate(ss):
                p = self.P(al, s)
                if prev is not None: arc += (p - prev).length
                prev = p
                rho = math.hypot(p.x, p.y)
                idx[i, j] = len(verts); verts.append(p); uvs.append((al * max(rho, 0.02) if False else al * rho, arc))
        faces, fuv, fm = [], [], []
        for i in range(NA):
            alc = (als[i] + als[i + 1]) / 2
            for j in range(NS):
                sc = (ss[j] + ss[j + 1]) / 2
                if cutout and cutout(alc, sc): continue
                q = (idx[i, j], idx[i + 1, j], idx[i + 1, j + 1], idx[i, j + 1])
                faces.append(q); fm.append(mat_fn(alc) if mat_fn else 0)
        # top fan
        apex = len(verts); top = self.P(0, 1.0); verts.append(Vector((0, 0, top.z + 0.003)))
        uvs.append((0.0, uvs[idx[0, NS]][1] + 0.01))
        for i in range(NA):
            faces.append((idx[i, NS], idx[i + 1, NS], apex)); fm.append(mat_fn((als[i] + als[i + 1]) / 2) if mat_fn else 0)
        me = bpy.data.meshes.new(name); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
        uvl = me.uv_layers.new(name="UVMap")
        for poly, m in zip(me.polygons, fm):
            poly.use_smooth = True; poly.material_index = m
            for li in poly.loop_indices:
                uvl.data[li].uv = uvs[me.loops[li].vertex_index]
        ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
        return ob

def link_obj(name, me):
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob); return ob

def tube_along(name, pts, radius, mat):
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (p.x, p.y, p.z, 1)
    cu.bevel_depth = radius; cu.bevel_resolution = 2; cu.use_fill_caps = True
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    cu.materials.append(mat); return ob

def solidify(ob, t, offset=-1, mo=0, mor=0, rim=True):
    m = ob.modifiers.new("solid", "SOLIDIFY"); m.thickness = t; m.offset = offset
    m.material_offset = mo; m.material_offset_rim = mor; m.use_rim = rim; m.use_even_offset = True
    return m

def build_brim(cr, mats, D0=0.80, almax=math.radians(78), tilt=0.10, bend=0.0, NBA=140, NBV=18, thick=0.035, lift=0.0):
    verts, uvs = [], []
    for i in range(NBA + 1):
        al = -almax + 2 * almax * i / NBA
        p0 = cr.P(al, 0.0)
        t = Vector((cr.a * math.cos(al), cr.b * math.sin(al), 0)).normalized()
        n = Vector((t.y, -t.x, 0))
        if n.dot(Vector((p0.x, p0.y, 0))) < 0: n = -n
        D = D0 * max(0.0, 1 - (al / almax) ** 2) ** 0.5
        for j in range(NBV + 1):
            v = j / NBV
            p = p0 + n * (D * v)
            p.z = p0.z - tilt * D * v - bend * (p.x ** 2) * (0.35 + 0.65 * v) + lift
            verts.append(p); uvs.append((al * 0.95, v))
    faces = []
    for i in range(NBA):
        for j in range(NBV):
            a = i * (NBV + 1) + j
            faces.append((a, a + NBV + 1, a + NBV + 2, a + 1))
    me = bpy.data.meshes.new("brim"); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    # make sure normals point up
    me.flip_normals() if me.polygons[len(me.polygons) // 2].normal.z < 0 else None
    uvl = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices: uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    ob = link_obj("brim", me)
    for m in mats: ob.data.materials.append(m)
    solidify(ob, thick, offset=-1, mo=1, mor=2 if len(mats) > 2 else 0)
    sub = ob.modifiers.new("sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 2
    return ob

def add_details(cr, fabric_m, seam_m, eyelet_m, button_m, seams=True, eyelets=True, nseam=6, skip_front=False):
    if seams:
        for k in range(nseam):
            al = -math.pi + k * 2 * math.pi / nseam
            if skip_front and abs(al) < 1e-6: continue
            pts = [cr.P(al, s) + cr.N(al, s) * (0.006 * (1 - s) + 0.001) for s in [i / 60 * 0.93 for i in range(61)]]
            tube_along(f"seam{k}", pts, 0.0065, seam_m)
    if eyelets:
        for k in range(nseam):
            al = -math.pi + (k + 0.5) * 2 * math.pi / nseam
            s = 0.62
            p, n = cr.P(al, s), cr.N(al, s)
            bpy.ops.mesh.primitive_torus_add(major_radius=0.026, minor_radius=0.009, major_segments=32, minor_segments=10)
            t = bpy.context.active_object; t.location = p + n * 0.004
            t.rotation_euler = n.to_track_quat("Z", "Y").to_euler(); t.data.materials.append(eyelet_m)
            bpy.ops.object.shade_smooth()
    # top button
    top = cr.P(0, 1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.078, segments=32, ring_count=16, location=(0, 0, top.z + 0.004))
    bt = bpy.context.active_object; bt.scale = (1, 1, 0.42); bt.data.materials.append(button_m); bpy.ops.object.shade_smooth()

def add_snap_strap(cr, mat):
    # plastic snap strap across the back opening
    pts = []
    for i in range(41):
        al = math.pi - math.radians(32) + math.radians(64) * i / 40
        pts.append(cr.P(al, 0.06) + cr.N(al, 0.06) * 0.012)
    cu = bpy.data.curves.new("strap", "CURVE"); cu.dimensions = "3D"
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (p.x, p.y, p.z, 1)
    cu.extrude = 0.055; cu.bevel_depth = 0.008
    ob = bpy.data.objects.new("strap", cu); bpy.context.scene.collection.objects.link(ob); cu.materials.append(mat)
    for k in range(7):
        al = math.pi - math.radians(26) + math.radians(52) * k / 6
        p, n = cr.P(al, 0.06), cr.N(al, 0.06)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.016, depth=0.02, location=p + n * 0.026)
        c = bpy.context.active_object; c.rotation_euler = n.to_track_quat("Z", "Y").to_euler(); c.data.materials.append(mat)

# --------------------------------------------------------------------- hats
def cap(spec):
    style = spec["style"]   # snapback | trucker | dad
    color = spec["color"]
    if style == "dad":
        cr = Crown(a=0.90, b=1.0, H=0.98, p=2.25, front_lift=0.06)
    else:
        cr = Crown(a=float(arg("--ca", "0.90")), b=1.0, H=float(arg("--H", "1.25")), p=float(arg("--p", "2.4")), front_lift=float(arg("--fl", "0.18")))
    patch = spec.get("patch")
    kind = spec.get("kind", "twill")
    front = fabric("front", spec.get("front", color), "foam" if style == "trucker" else kind, patch=patch)
    mats = [front]
    if style == "trucker":
        mats.append(fabric("mesh", spec.get("mesh", "#f1efe9"), "mesh"))
        matfn = lambda al: 0 if abs(al) < math.radians(60) else 1
    else:
        matfn = None
    inner = simple("inner", "#151515", 0.9)
    mats.append(inner)
    cut = (lambda al, s: abs(abs(al) - math.pi) < math.radians(30) and s < 0.30 * math.cos((math.pi - abs(al)) / math.radians(30) * math.pi / 2) ** 0.5) if style != "dad" else \
          (lambda al, s: abs(abs(al) - math.pi) < math.radians(22) and s < 0.20 * math.cos((math.pi - abs(al)) / math.radians(22) * math.pi / 2) ** 0.5)
    ob = cr.build("crown", matfn, cutout=cut)
    for m in mats: ob.data.materials.append(m)
    solidify(ob, 0.018, offset=-1, mo=len(mats) - 1, mor=len(mats) - 1)
    seam_c = spec.get("seam", spec.get("front", color))
    seam_m = fabric("seam", seam_c, "twill") if not spec.get("seam") else simple("seamthread", spec["seam"], 0.55, sheen=0.4)
    eyelet_m = simple("eyelet", spec.get("eyelet", spec.get("front", color)), 0.7, sheen=0.5)
    button_m = fabric("button", spec.get("front", color) if style != "trucker" else spec.get("mesh", "#f1efe9"), "twill")
    add_details(cr, front, seam_m, eyelet_m, button_m, skip_front=bool(patch) and not patch.get("tile"))
    if style != "dad":
        add_snap_strap(cr, simple("snap", spec.get("strap", "#111111"), 0.35))
    top = brim_top_mat("brimtop", spec.get("brim", spec.get("front", color)), kind if kind == "denim" else "twill",
                       rows=8 if style != "dad" else 6, thread=spec.get("thread", lighten(spec.get("brim", spec.get("front", color)), 0.18)),
                       start=0.08 if style != "dad" else 0.45)
    under = simple("under", spec.get("under", spec.get("brim", spec.get("front", color))), 0.85, sheen=0.5)
    bm = [top, under]
    if spec.get("piping"): bm.append(simple("piping", spec["piping"], 0.35, metal=0.7))
    if style == "dad":
        build_brim(cr, bm, D0=0.95, tilt=0.07, bend=0.24, thick=0.03)
    else:
        build_brim(cr, bm, D0=float(arg("--D0", "1.0")), tilt=0.06, bend=0.02, thick=0.04)
    return cr

def beanie(spec):
    color = spec["color"]
    body = Crown(a=0.93, b=0.98, H=1.30, p=2.55, front_lift=0.0)
    knit = fabric("knit", color, "knit")
    ob = body.build("beanie", None, NA=256, NS=96)
    ob.data.materials.append(knit)
    ob.location.z = 0.02
    sub = ob.modifiers.new("sub", "SUBSURF"); sub.levels = 1; sub.render_levels = 1
    # cuff: band around the base, slightly bigger, with a rolled top edge
    NA, NV = 256, 26
    verts, uvs = [], []
    Hc = 0.46
    for i in range(NA + 1):
        al = -math.pi + 2 * math.pi * i / NA
        arc = 0.0; prev = None
        for j in range(NV + 1):
            t = j / NV
            # profile: straight up then rolls over
            if t < 0.82:
                z = t / 0.82 * Hc; r = 1.065 + 0.012 * math.sin(t / 0.82 * math.pi)
            else:
                a = (t - 0.82) / 0.18 * math.pi
                z = Hc + 0.035 * math.sin(a); r = 1.065 + 0.035 * (1 - math.cos(a)) * -1 + 0.0
            x = body.a * r * math.sin(al); y = -body.b * r * math.cos(al)
            p = Vector((x, y, z))
            if prev is not None: arc += (p - prev).length
            prev = p
            verts.append(p); uvs.append((al * body.a * 1.065, arc))
    faces = []
    for i in range(NA):
        for j in range(NV):
            a = i * (NV + 1) + j
            faces.append((a, a + NV + 1, a + NV + 2, a + 1))
    me = bpy.data.meshes.new("cuff"); me.from_pydata([tuple(v) for v in verts], [], faces); me.update()
    uvl = me.uv_layers.new(name="UVMap")
    for poly in me.polygons:
        poly.use_smooth = True
        for li in poly.loop_indices: uvl.data[li].uv = uvs[me.loops[li].vertex_index]
    cuff = link_obj("cuff", me)
    lab = spec.get("label", True)
    cm = fabric("cuffknit", color, "knit")
    cuff.data.materials.append(cm)
    solidify(cuff, 0.05, offset=1)
    # woven label on the cuff front
    if lab:
        w, h = 0.36, 0.20
        bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=12, size=1)
        g = bpy.context.active_object; g.scale = (w, h, 1)
        bpy.ops.object.transform_apply(scale=True)
        # wrap the label around the cuff
        for v in g.data.vertices:
            al = v.co.x / (body.a * 1.13)
            r = 1.13
            v.co = Vector((body.a * r * math.sin(al), -body.b * r * math.cos(al), Hc * 0.5 + v.co.y))
        g.data.uv_layers.active.name = "UVMap"
        lm = NB("label"); c, a = lm.image(os.path.join(TEX, "label.png"), lm.uv(), "CLIP")
        lm.link(c, lm.bsdf.inputs["Base Color"]); lm.link(a, lm.bsdf.inputs["Alpha"])
        lm.bsdf.inputs["Roughness"].default_value = 0.55; lm.bsdf.inputs["Sheen Weight"].default_value = 0.3
        g.data.materials.append(lm.m); bpy.ops.object.shade_smooth()
    return body

HATS = {
    "signature-black": dict(type="cap", style="snapback", color="#151515", under="#151515", thread="#3a3833",
                            patch=dict(img="badge.png", center=(0.0, 0.62), size=(0.56, 0.56), puff=1.2), piping="#c99a3a"),
    "trucker-pink": dict(type="cap", style="trucker", color="#e0558f", mesh="#f2f0ea", under="#2f2f2f",
                         patch=dict(img="crown.png", center=(0.0, 0.66), size=(0.46, 0.46), metal=0.55)),
    "trucker-blue": dict(type="cap", style="trucker", color="#2f67c9", mesh="#f2f0ea", under="#2f2f2f",
                         patch=dict(img="crown.png", center=(0.0, 0.66), size=(0.46, 0.46), metal=0.55)),
    "trucker-black": dict(type="cap", style="trucker", color="#171717", mesh="#202020", under="#2f2f2f", thread="#3a3833",
                          patch=dict(img="crown.png", center=(0.0, 0.66), size=(0.46, 0.46), metal=0.55)),
    "denim-medium": dict(type="cap", style="dad", kind="denim", color="#22406b", seam="#d6ad55", thread="#d6ad55",
                         patch=dict(img="crown.png", center=(0.0, 0.50), size=(0.34, 0.34), metal=0.55)),
    "denim-light": dict(type="cap", style="dad", kind="denim", color="#7e9dbf", seam="#e7dcc4", thread="#e7dcc4",
                        patch=dict(img="crown.png", center=(0.0, 0.50), size=(0.34, 0.34), metal=0.55)),
    "custom-black": dict(type="cap", style="snapback", color="#151515", under="#151515", thread="#3a3833",
                         patch=dict(img="monogram.png", center=(0.0, 0.62), size=(1.0, 1.0), tile=(1.6, 1.6), limit_u=0.80, limit_v=1.30, metal=0.35, puff=0.9)),
    "custom-pink": dict(type="cap", style="snapback", color="#e0558f", under="#2b2b2b",
                        patch=dict(img="monogram.png", center=(0.0, 0.62), size=(1.0, 1.0), tile=(1.6, 1.6), limit_u=0.80, limit_v=1.30, metal=0.35, puff=0.9)),
    "custom-blue": dict(type="cap", style="snapback", color="#2f67c9", under="#2b2b2b",
                        patch=dict(img="monogram.png", center=(0.0, 0.62), size=(1.0, 1.0), tile=(1.6, 1.6), limit_u=0.80, limit_v=1.30, metal=0.35, puff=0.9)),
    "beanie-black": dict(type="beanie", color="#1b1b1b"),
    "beanie-pink": dict(type="beanie", color="#e06a98"),
    "beanie-blue": dict(type="beanie", color="#3466c4"),
}

def render(name, spec):
    sc = reset()
    if spec["type"] == "cap":
        cap(spec)
        # tilt the cap back a little (like it's resting on its back edge) so the brim faces the camera
        piv = bpy.data.objects.new("pivot", None); sc.collection.objects.link(piv); piv.location = (0, 1.0, 0)
        for o in list(sc.objects):
            if o.type in ("MESH", "CURVE") and o.name != "backdrop" and o.parent is None:
                mw = o.matrix_world.copy(); o.parent = piv; o.matrix_world = mw
        piv.rotation_euler = (math.radians(float(arg("--tilt", "-15"))), 0, math.radians(float(arg("--turn", "0"))))
        studio(sc, target=Vector((float(arg("--tx", "-0.55")), -0.55, float(arg("--tz", "0.88")))), cam_az=float(arg("--az", "-38")), cam_el=float(arg("--el", "16")), dist=float(arg("--dist", "8.6")), lens=85)
    else:
        beanie(spec)
        studio(sc, target=Vector((0.0, 0.0, 0.72)), cam_az=-22, cam_el=14, dist=8.4, lens=85)
    sc.render.filepath = os.path.join(OUT, name + arg("--suffix", "") + ".png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", name, flush=True)

for name, spec in HATS.items():
    if ONLY and name not in ONLY: continue
    render(name, spec)
