'use client';

import type { CSSProperties } from 'react';
import { getAvailableSizes, getModelSpec, MODELS, clsx } from '../_lib/data';
import { useStore } from '../_lib/store';
import { I } from './Icons';

export function ParamsDrawer() {
  const { drawerOpen, setDrawerOpen, model, setModel, ratio, setRatio, n, setN, adv, setAdv } = useStore();
  if (!drawerOpen) return null;

  const modelSpec = getModelSpec(model);
  const availableSizes = getAvailableSizes(modelSpec, adv.resolution);

  const patch = (kv: Partial<typeof adv>, specOverride = modelSpec) => {
    const next = { ...adv, ...kv };
    if (!next.googleSearch) next.googleImageSearch = false;
    setAdv(next);

    const nextSizes = getAvailableSizes(specOverride, next.resolution);
    if (!nextSizes.includes(ratio)) setRatio(nextSizes[0]);
  };

  const chooseModel = (nextModel: string) => {
    const nextSpec = getModelSpec(nextModel);
    const nextSizes = getAvailableSizes(nextSpec, adv.resolution);
    setModel(nextModel);
    if (!nextSizes.includes(ratio)) setRatio(nextSizes[0]);
    if (n > nextSpec.maxN) setN(nextSpec.maxN);
    if (nextSpec.supportsResolution && nextSpec.resolutions?.length && !nextSpec.resolutions.includes(adv.resolution)) {
      patch({ resolution: nextSpec.resolutions[0] }, nextSpec);
    }
  };

  return (
    <>
      <div className="drawer-mask" onClick={() => setDrawerOpen(false)} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>Params</h2>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
              {modelSpec.label} · {modelSpec.sub}
            </div>
          </div>
          <button className="close" onClick={() => setDrawerOpen(false)}><I.X /></button>
        </div>

        <div className="drawer-body">
          <div className="field">
            <div className="label"><span className="name">model</span><span className="hint">required</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              {Object.entries(MODELS).map(([key, spec]) => (
                <button
                  key={key}
                  className={clsx('opt', key === model && 'active')}
                  onClick={() => chooseModel(key)}
                  style={{ textAlign: 'left', padding: 10 }}
                >
                  <div style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 3 }}>{spec.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--fg-4)' }}>{spec.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <div className="label">
              <span className="name">size</span>
              <span className="hint">{availableSizes.length} / {modelSpec.sizes.length} available</span>
            </div>
            <div className="grid-opts" style={{ '--gcols': 5 } as CSSProperties}>
              {modelSpec.sizes.map((size) => {
                const disabled = !availableSizes.includes(size);
                const [a, b] = size.split(':').map(Number);
                const base = 22;
                const w = a >= b ? base : Math.round((base * a) / b);
                const h = b >= a ? base : Math.round((base * b) / a);
                return (
                  <button
                    key={size}
                    className={clsx('opt', size === ratio && 'active', disabled && 'disabled')}
                    disabled={disabled}
                    onClick={() => !disabled && setRatio(size)}
                  >
                    <span className="shape" style={{ width: w, height: h }} />
                    {size}
                  </button>
                );
              })}
            </div>
            {adv.resolution === '4k' && modelSpec.sizes4k?.length ? (
              <div className="desc">Only a subset of aspect ratios is available for 4k output.</div>
            ) : null}
          </div>

          <div className="field">
            <div className="label"><span className="name">n</span><span className="hint">1 - {modelSpec.maxN}</span></div>
            <div className="grid-opts" style={{ '--gcols': 4 } as CSSProperties}>
              {[1, 2, 3, 4].map((value) => (
                <button
                  key={value}
                  disabled={value > modelSpec.maxN}
                  className={clsx('opt', value === n && 'active', value > modelSpec.maxN && 'disabled')}
                  onClick={() => value <= modelSpec.maxN && setN(value)}
                >
                  x{value}
                </button>
              ))}
            </div>
          </div>

          {modelSpec.supportsResolution ? (
            <div className="field">
              <div className="label"><span className="name">resolution</span><span className="hint">higher is slower</span></div>
              <div className="grid-opts" style={{ '--gcols': 4 } as CSSProperties}>
                {modelSpec.resolutions?.map((resolution) => (
                  <button
                    key={resolution}
                    className={clsx('opt', resolution === adv.resolution && 'active')}
                    onClick={() => patch({ resolution })}
                  >
                    {resolution}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {modelSpec.supportsQuality ? (
            <div className="field">
              <div className="label"><span className="name">quality</span></div>
              <div className="grid-opts" style={{ '--gcols': 4 } as CSSProperties}>
                {modelSpec.qualities?.map((quality) => (
                  <button
                    key={quality}
                    className={clsx('opt', quality === adv.quality && 'active')}
                    onClick={() => patch({ quality })}
                  >
                    {quality}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {modelSpec.supportsBackground ? (
            <div className="field">
              <div className="label"><span className="name">background</span></div>
              <div className="grid-opts" style={{ '--gcols': 2 } as CSSProperties}>
                {modelSpec.backgrounds?.map((background) => (
                  <button
                    key={background}
                    className={clsx('opt', background === adv.background && 'active')}
                    onClick={() => patch({ background })}
                  >
                    {background}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {modelSpec.supportsModeration ? (
            <div className="field">
              <div className="label"><span className="name">moderation</span></div>
              <div className="grid-opts" style={{ '--gcols': 2 } as CSSProperties}>
                {modelSpec.moderations?.map((moderation) => (
                  <button
                    key={moderation}
                    className={clsx('opt', moderation === adv.moderation && 'active')}
                    onClick={() => patch({ moderation })}
                  >
                    {moderation}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {modelSpec.supportsOutputFormat ? (
            <>
              <div className="field">
                <div className="label"><span className="name">output_format</span></div>
                <div className="grid-opts" style={{ '--gcols': 3 } as CSSProperties}>
                  {modelSpec.formats?.map((format) => (
                    <button
                      key={format}
                      className={clsx('opt', format === adv.format && 'active')}
                      onClick={() => patch({ format })}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {adv.format !== 'png' ? (
                <div className="field">
                  <div className="label"><span className="name">output_compression</span><span className="hint">{adv.compression}</span></div>
                  <div className="slider-row">
                    <input type="range" min={0} max={100} value={adv.compression} onChange={(e) => patch({ compression: +e.target.value })} />
                    <span className="val">{adv.compression}</span>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {modelSpec.supportsMask ? (
            <div className="field">
              <div className="label" style={{ marginBottom: 0 }}>
                <span className="name">mask_url <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>(inpainting)</span></span>
              </div>
              <input
                className="input-box"
                placeholder="https://..."
                style={{ marginTop: 8 }}
                value={adv.maskUrl ?? ''}
                onChange={(e) => patch({ maskUrl: e.target.value })}
              />
              <div className="desc">Requires at least one reference image, and the mask size must match the first reference image.</div>
            </div>
          ) : null}

          {modelSpec.supportsOfficialFallback ? (
            <div className="field">
              <div className="label" style={{ alignItems: 'center' }}>
                <span className="name">official_fallback</span>
                <div className={clsx('switch', adv.fallback && 'on')} onClick={() => patch({ fallback: !adv.fallback })} />
              </div>
              <div className="desc">Automatically switch to the matching official channel when the standard channel is unavailable.</div>
            </div>
          ) : null}

          <div className="field">
            <div className="label">
              <span className="name">image_urls</span>
              <span className="hint">≤ {modelSpec.maxRefs}</span>
            </div>
            <div className="desc">Upload references from the composer attachment button. Per-file limit: {modelSpec.maxFileSizeMb}MB.</div>
          </div>
        </div>
      </div>
    </>
  );
}
