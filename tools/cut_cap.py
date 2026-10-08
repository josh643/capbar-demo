import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.asarray(Image.open('../work/newlogo_src.jpg').convert('RGB')).astype(float)
mx=im.max(2); mn=im.min(2)
cx,cy,r=np.load('../work/ring.npy')
H,W=mx.shape
yy,xx=np.mgrid[:H,:W]
d=np.sqrt((xx-cx)**2+(yy-cy)**2)
R_,B_=im[...,0],im[...,2]
ringgold=(np.abs(d-r)<22)&(R_>90)&(R_-B_>50)
CY=600
mx,mn,ringgold=mx[:CY],mn[:CY],ringgold[:CY]
bright=(mx>45)&~ringgold
wd=ndi.binary_dilation(bright, iterations=6)
wd=np.pad(wd,1,constant_values=False)
lab,n=ndi.label(~wd); bg=lab[0,0]
enc=ndi.binary_fill_holes((lab!=bg)[1:-1,1:-1])
lab2,_=ndi.label(enc); region=lab2==lab2[289,404]
# bright pixels that belong to the cap
cb=bright & region & (mx>90)
lbl,_=ndi.label(cb); sizes=np.bincount(lbl.ravel()); sizes[0]=0
keep=np.isin(lbl, np.where(sizes>40)[0]); cb=keep
yy2,xx2=np.mgrid[-9:10,-9:10]; disk=(xx2**2+yy2**2)<=81
pad=30
cbp=np.pad(cb,pad)
sil=ndi.binary_closing(cbp, structure=disk)[pad:-pad,pad:-pad]
sil=ndi.binary_fill_holes(sil|cb|ndi.binary_erosion(region,iterations=10))
sil&=~ringgold
lbl,_=ndi.label(sil); sizes=np.bincount(lbl.ravel()); sizes[0]=0
sil=lbl==sizes.argmax()
# row-wise trim: nothing may stick out past the outermost bright (outline) pixel in its row
bb=(mx>110)&sil
for y in range(sil.shape[0]):
    xs_=np.where(bb[y])[0]
    if len(xs_)==0: sil[y]=False; continue
    sil[y,:max(xs_[0]-1,0)]=False; sil[y,xs_[-1]+2:]=False
# anti-aliased edge from a slightly supersampled distance field
dt_in=ndi.distance_transform_edt(sil); dt_out=ndi.distance_transform_edt(~sil)
sd=np.where(sil, dt_in-0.5, -(dt_out-0.5))
alpha=np.clip(sd+0.5,0,1)
rgb=im[:CY].copy()
out=np.dstack([rgb, alpha*255]).astype(np.uint8)
ys,xs=np.where(alpha>0.02)
out=out[ys.min()-3:ys.max()+4, xs.min()-3:xs.max()+4]
Image.fromarray(out).save('site/images/cap-mark.png')
o=Image.fromarray(out)
for name,col in [('red',(200,30,30,255)),('black',(12,12,12,255))]:
    bgc=Image.new('RGBA',o.size,col); bgc.alpha_composite(o); bgc.save(f'/tmp/cap_on_{name}_v9.png')
print(out.shape)
