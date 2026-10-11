// World units. Existing radius, substep and bridge extents are preserved.
export const motionConfig = Object.freeze({
 radius: .32, substep: .18, bridgeRailInset: .38, bridgeEntryInset: .37,
 bridgeEntryTolerance: .15, maxStepUp: .45, maxSnapDown: .65,
 maxSlope: .85, contactTolerance: .002, recoveryDistance: .8,
 movingSpeedThreshold: .01, maxSubsteps: 4096,
});
// No accepted embedded clips exist for this asset. Fill names only after asset acceptance.
export const scholarAnimation = Object.freeze({
 assetId: 'asset_scholar_v2', clipNames: {idle: null, walk: null},
 clipsAccepted: false, fadeSeconds: .18,
 fallback: 'procedural-skeleton',
});
