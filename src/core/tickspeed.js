import { DC } from "./constants";
import { Effects } from "./game-mechanics/effects";
import { CorruptionUpgrade, Ra, V } from "./globals";
import { corruptionPenalties } from "./secret-formula/mending/corruption";

export function effectiveBaseGalaxies() {
  // Note that this already includes the "50% more" active path effect
  let replicantiGalaxies = Replicanti.galaxies.bought;
  let matterGalaxies = 0;//Kohler.isRunning ? MatterUpgrade(12).effectOrDefault(0) : 0;
  replicantiGalaxies *= (1 + Effects.sum(
    TimeStudy(132),
    TimeStudy(133)
  ));
  // "extra" galaxies unaffected by the passive/idle boosts come from studies 225/226 and Effarig Infinity
  replicantiGalaxies += Replicanti.galaxies.extra;
  const nonActivePathReplicantiGalaxies = Math.min(Replicanti.galaxies.bought,
    ReplicantiUpgrade.galaxies.value);
  // Effects.sum is intentional here - if EC8 is not completed,
  // this value should not be contributed to total replicanti galaxies
  if(EternityChallenge(8).completions >= 1){
    replicantiGalaxies += nonActivePathReplicantiGalaxies * EternityChallenge(8).reward.effectValue;
    if(Ra.unlocks.improvedECRewards.canBeApplied && !Pelle.isDoomed) replicantiGalaxies += nonActivePathReplicantiGalaxies * EternityChallenge(8).vReward.effectValue;
  }
  let freeGalaxies = player.dilation.totalTachyonGalaxies;
  freeGalaxies *= 1 + Math.max(0, Replicanti.amount.log10() / 1e6) * AlchemyResource.alternation.effectValue;
  let x = player.galaxies;
  let y = GalaxyGenerator.galaxies;
  if(Ra.unlocks.improvedECRewards.canBeApplied && EternityChallenge(8).completions >= 1 && !Pelle.isDoomed){
    freeGalaxies *= 1 + EternityChallenge(8).vReward.effectValue;
    x *= 1 + EternityChallenge(8).vReward.effectValue;
    y *= 1 + EternityChallenge(8).vReward.effectValue;
  }
  let v = player.galBoostPoints.eq(0) ? 1 : /*(player.galBoostPoints.pow(1/(player.galBoostPoints.log10() ** 0.8))).div(100).add(1).toNumber()*/ MultiversalDimension(1).galaxyBoost
  let w = 1;
  let u = 1;
  return (Math.max(x + y + replicantiGalaxies + freeGalaxies + matterGalaxies, 0) * v * w * u);
}

export function getTickSpeedMultiplier() {
  if (InfinityChallenge(3).isRunning) return DC.D1;
  if (Ra.isRunning) return DC.C1D1_1245;
  let galaxies = effectiveBaseGalaxies();
  const effects = Effects.product(
    InfinityUpgrade.galaxyBoost,
    InfinityUpgrade.galaxyBoost.chargedEffect,
    BreakInfinityUpgrade.galaxyBoost,
    BreakInfinityUpgrade.galaxyBoost.chargedEffect,
    TimeStudy(212),
    TimeStudy(232),
    TimeStudy(401),
    Achievement(86),
    Achievement(178),
    InfinityChallenge(5).reward,
    PelleUpgrade.galaxyPower,
    PelleRifts.decay.milestones[1],
    Ra.unlocks.gamespeedGalaxyBoost
  );
  if (galaxies < 3) {
    // Magic numbers are to retain balancing from before while displaying
    // them now as positive multipliers rather than negative percentages
    let baseMultiplier = 1 / 1.1245;
    if (player.galaxies === 1) baseMultiplier = 1 / 1.11888888;
    if (player.galaxies === 2) baseMultiplier = 1 / 1.11267177;
    if (NormalChallenge(5).isRunning) {
      baseMultiplier = 1 / 1.08;
      if (player.galaxies === 1) baseMultiplier = 1 / 1.07632;
      if (player.galaxies === 2) baseMultiplier = 1 / 1.072;
    }
    const perGalaxy = 0.02 * effects;
    if (Pelle.isDoomed) galaxies *= 0.5;

    galaxies *= Pelle.specialGlyphEffect.power;
    return DC.D0_01.clampMin(baseMultiplier - (galaxies * perGalaxy));
  }
  let baseMultiplier = 0.8;
  if (NormalChallenge(5).isRunning) baseMultiplier = 0.83;
  galaxies -= 2;
  galaxies *= effects;
  galaxies *= getAdjustedGlyphEffect("cursedgalaxies");
  galaxies *= getAdjustedGlyphEffect("realitygalaxies");
  galaxies *= 1 + ImaginaryUpgrade(9).effectOrDefault(0);
  if (Pelle.isDoomed) galaxies *= 0.5;

  if (player.mending.corruptionChallenge.corruptedMend) {
    let galWeakStrength = corruptionPenalties.galWeak.strength[player.mending.corruption[3]];
    if(CorruptionUpgrade(19).isBought) galWeakStrength = Math.min(galWeakStrength * 1.4, CorruptionUpgrade(19).effectValue)
    galaxies *= (galWeakStrength)
  };

  galaxies *= Pelle.specialGlyphEffect.power;
  const perGalaxy = DC.D0_965;
  let finalAnswer = perGalaxy.pow(galaxies - 2).times(baseMultiplier);
  return finalAnswer;
}

export function buyTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable) return false;

  if (NormalChallenge(9).isRunning) {
    Tickspeed.multiplySameCosts();
  }
  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  Currency.antimatter.subtract(Tickspeed.cost);
  player.totalTickBought++;
  player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
  player.requirementChecks.permanent.singleTickspeed++;
  if (NormalChallenge(2).isRunning) player.chall2Pow = 0;
  GameUI.update();
  return true;
}

export function buyMaxTickSpeed() {
  if (!Tickspeed.isAvailableForPurchase || !Tickspeed.isAffordable) return;
  let boughtTickspeed = false;

  Tutorial.turnOffEffect(TUTORIAL_STATE.TICKSPEED);
  if (NormalChallenge(9).isRunning) {
    const goal = Player.infinityGoal;
    let cost = Tickspeed.cost;
    while (Currency.antimatter.gt(cost) && cost.lt(goal)) {
      Tickspeed.multiplySameCosts();
      Currency.antimatter.subtract(cost);
      player.totalTickBought++;
      boughtTickspeed = true;
      cost = Tickspeed.cost;
    }
  } else {
    const purchases = Tickspeed.costScale.getMaxBought(player.totalTickBought, Currency.antimatter.value, 1);
    if (purchases === null) {
      return;
    }
    Currency.antimatter.subtract(Decimal.pow10(purchases.logPrice));
    player.totalTickBought += purchases.quantity;
    boughtTickspeed = true;
  }

  if (boughtTickspeed) {
    player.records.thisInfinity.lastBuyTime = player.records.thisInfinity.time;
    if (NormalChallenge(2).isRunning) player.chall2Pow = 0;
  }
}

export function resetTickspeed() {
  player.totalTickBought = 0;
  player.chall9TickspeedCostBumps = 0;
}

export const Tickspeed = {

  get isUnlocked() {
    return AntimatterDimension(2).bought > 0 || EternityMilestone.unlockAllND.isReached ||
      PlayerProgress.realityUnlocked();
  },

  get isAvailableForPurchase() {
    return this.isUnlocked &&
      !EternityChallenge(9).isRunning &&
      !Laitela.continuumActive &&
      (player.break || this.cost.lt(Decimal.NUMBER_MAX_VALUE));
  },

  get isAffordable() {
    return Currency.antimatter.gte(this.cost);
  },

  get multiplier() {
    return getTickSpeedMultiplier();
  },

  get current() {
    let tickspeed = Effarig.isRunning
      ? Effarig.tickspeed
      : /*V.isSuperRunning ? this.baseValue.powEffectOf(DilationUpgrade.tickspeedPower).reciprocal().log2().toDecimal().reciprocal() : */this.baseValue.powEffectOf(DilationUpgrade.tickspeedPower);
      if (player.mending.corruptionChallenge.corruptedMend) {
        let tickExtensionTickspeed = corruptionPenalties.tickExtension[player.mending.corruption[5]];
        if(CorruptionUpgrade(21).isBought) tickExtensionTickspeed=tickExtensionTickspeed**0.5;
        let corruptPen = new Decimal(1).div(tickExtensionTickspeed);
        tickspeed = tickspeed.pow(corruptPen);
      };
      if(V.isSuperRunning) tickspeed = tickspeed.pow(0.000001);
      if (Kohler.isRunning) tickspeed = tickspeed.pow(energyEffect());
    return player.dilation.active || PelleStrikes.dilation.hasStrike ? dilatedValueOf(tickspeed) : tickspeed;
  },

  get cost() {
    return this.costScale.calculateCost(player.totalTickBought + player.chall9TickspeedCostBumps);
  },

  get costScale() {
    return new ExponentialCostScaling({
      baseCost: 1000,
      baseIncrease: 10,
      costScale: Player.tickSpeedMultDecrease,
      scalingCostThreshold: Number.MAX_VALUE
    });
  },

  get continuumValue() {
    if (!this.isUnlocked) return 0;
    return this.costScale.getContinuumValue(Currency.antimatter.value, 1) * Laitela.matterExtraPurchaseFactor;
  },

  get baseValue() {
    return DC.E3.timesEffectsOf(
      Achievement(36),
      Achievement(45),
      Achievement(66),
      Achievement(83)
    )
      .times(getTickSpeedMultiplier().pow(this.totalUpgrades));
  },

  get totalUpgrades() {
    let boughtTickspeed;
    if (Laitela.continuumActive) boughtTickspeed = this.continuumValue;
    else boughtTickspeed = player.totalTickBought;
    return boughtTickspeed + player.totalTickGained;
  },

  get perSecond() {
    return Decimal.divide(1000, this.current);
  },

  multiplySameCosts() {
    for (const dimension of AntimatterDimensions.all) {
      if (dimension.cost.e === this.cost.e) dimension.costBumps++;
    }
  }
};


export const FreeTickspeed = {
  BASE_SOFTCAP: 300000,
  GROWTH_RATE: 6e-6,
  GROWTH_EXP: 2,
  multToNext: 1.33,

  get amount() {
    return player.totalTickGained;
  },

  get softcap() {
    let softcap = FreeTickspeed.BASE_SOFTCAP;
    if (Enslaved.has(ENSLAVED_UNLOCKS.FREE_TICKSPEED_SOFTCAP)) {
      softcap += 100000;
    }
    if (Ra.unlocks.freeTickspeedSoftcapDelay.isUnlocked){
      softcap += (10000 * Tesseracts.effectiveCount);
    }
    if(TimeStudy(403).isBought){
      softcap += TimeStudy(403).effectOrDefault(0);
    }
    return softcap;
  },

  fromShards(shards) {
    let y = this.GROWTH_EXP;
    if (Ra.unlocks.improvedECRewards.canBeApplied && EternityChallenge(11).completions >= 1 && !Pelle.isDoomed) y = y ** EternityChallenge(11).vReward.effectValue; 
    const tickmult = (1 + (Effects.min(Effects.min(1.33, TimeStudy(171)),TimeStudy(309)) - 1) *
      Math.max(getAdjustedGlyphEffect("cursedtickspeed"), 1));
    const logTickmult = Math.log(tickmult);
    const logShards = shards.ln();
    const uncapped = Math.max(0, logShards / logTickmult);
    if (uncapped <= FreeTickspeed.softcap) {
      this.multToNext = tickmult;
      return {
        newAmount: Math.ceil(uncapped),
        nextShards: Decimal.pow(tickmult, Math.ceil(uncapped))
      };
    }
    // Log of (cost - cost up to softcap)
    const priceToCap = FreeTickspeed.softcap * logTickmult;
    // In the following we're implicitly applying the function (ln(x) - priceToCap) / logTickmult to all costs,
    // so, for example, if the cost is 1 that means it's actually exp(priceToCap) * tickmult.
    const desiredCost = (logShards - priceToCap) / logTickmult;
    const costFormulaCoefficient = FreeTickspeed.GROWTH_RATE / y / logTickmult;
    // In the following we're implicitly subtracting softcap from bought,
    // so, for example, if bought is 1 that means it's actually softcap + 1.
    // The first term (the big one) is the asymptotically more important term (since FreeTickspeed.GROWTH_EXP > 1),
    // but is small initially. The second term allows us to continue the pre-cap free tickspeed upgrade scaling
    // of tickmult per upgrade.
    const boughtToCost = bought => costFormulaCoefficient * Math.pow(
      Math.max(bought, 0), y) + bought;
    const derivativeOfBoughtToCost = x => x * costFormulaCoefficient * Math.pow(
      Math.max(x, 0), y - 1) + 1;
    const newtonsMethod = bought => bought - (boughtToCost(bought) - desiredCost) / derivativeOfBoughtToCost(bought);
    let oldApproximation;
    let approximation = Math.min(
      desiredCost,
      Math.pow(desiredCost / costFormulaCoefficient, 1 / y)
    );
    let counter = 0;
    // The bought formula is concave upwards. We start with an over-estimate; when using newton's method,
    // this means that successive iterations are also over-etimates. Thus, we can just check for continued
    // progress with the approximation < oldApproximation check. The counter is a fallback.
    do {
      oldApproximation = approximation;
      approximation = newtonsMethod(approximation);
    } while (approximation < oldApproximation && ++counter < 100);
    let purchases = Math.floor(approximation);
    let originalPurchases = purchases;
    // This undoes the function we're implicitly applying to costs (the "+ 1") is because we want
    // the cost of the next upgrade.
    if (player.mending.corruptionChallenge.corruptedMend) {
      let tickExtensionTimeShard = corruptionPenalties.tickExtension[player.mending.corruption[5]];
      if(CorruptionUpgrade(21).isBought) tickExtensionTimeShard=tickExtensionTimeShard**0.75;
      purchases /= tickExtensionTimeShard;
      purchases = Math.floor(purchases);
    };

    const next = Decimal.exp(priceToCap + boughtToCost(originalPurchases + 1) * logTickmult);
    this.multToNext = Decimal.exp((boughtToCost(originalPurchases + 1) - boughtToCost(originalPurchases)) * logTickmult);
    
    return {
      newAmount: purchases + FreeTickspeed.softcap,
      nextShards: next,
    };
  }

};
