// Plain Node sanity check — no test framework required.
// Run: node utils/scoringSanityCheck.js
//
// Checks: no NaN/undefined, values stay in [0,100], diminishing returns
// hold where expected, and prints representative tables for manual review.

import {
    calcNutritionFromServings,
    calcFitnessFromWorkout,
    calcSleepScore,
    calcFocusScore,
    calcHydrationScore,
  } from './scoring.js'
  
  let failures = 0
  
  function assert(cond, msg) {
    if (!cond) {
      failures++
      console.error(`❌ FAIL: ${msg}`)
    }
  }
  
  function checkRange(label, value) {
    assert(Number.isFinite(value), `${label} is not a finite number (got ${value})`)
    assert(value >= 0 && value <= 100, `${label} out of [0,100] range (got ${value})`)
  }
  
  console.log('\n=== SLEEP (hours, quality=7) ===')
  const sleepHours = [0, 4, 5, 6, 7, 7.5, 8, 8.5, 9, 10, 12]
  let prevSleep = -1
  sleepHours.forEach((h) => {
    const score = calcSleepScore({ sleep_hours: h, sleep_quality: 7 })
    checkRange(`sleep(${h}h)`, score)
    console.log(`${h}h → ${score}`)
    if (h <= 8.25) {
      assert(score >= prevSleep, `sleep score should rise or hold approaching optimal (${h}h: ${score} < prev ${prevSleep})`)
      prevSleep = score
    }
  })
  
  console.log('\n=== VEGETABLES (servings) ===')
  const vegVals = [0, 1, 2, 3, 4, 5, 6, 8, 10]
  let prevVeg = -1
  vegVals.forEach((v) => {
    const score = calcNutritionFromServings({ vegetable_servings: v, fruit_servings: 0, protein_servings: 0, processed_servings: 0 })
    checkRange(`nutrition(veg=${v})`, score)
    assert(score >= prevVeg, `veg score should be monotonic non-decreasing (${v}: ${score} < prev ${prevVeg})`)
    prevVeg = score
    console.log(`${v} servings → ${score}`)
  })
  
  console.log('\n=== FRUIT (servings) ===')
  const fruitVals = [0, 1, 2, 3, 4, 5, 6, 8]
  let prevFruit = -1
  fruitVals.forEach((v) => {
    const score = calcNutritionFromServings({ fruit_servings: v, vegetable_servings: 0, protein_servings: 0, processed_servings: 0 })
    checkRange(`nutrition(fruit=${v})`, score)
    assert(score >= prevFruit, `fruit score should be monotonic non-decreasing (${v}: ${score} < prev ${prevFruit})`)
    prevFruit = score
    console.log(`${v} servings → ${score}`)
  })
  
  console.log('\n=== PROTEIN (servings) ===')
  const proteinVals = [0, 1, 2, 3, 4, 5, 6]
  let prevProtein = -1
  proteinVals.forEach((v) => {
    const score = calcNutritionFromServings({ protein_servings: v, fruit_servings: 0, vegetable_servings: 0, processed_servings: 0 })
    checkRange(`nutrition(protein=${v})`, score)
    assert(score >= prevProtein, `protein score should be monotonic non-decreasing (${v}: ${score} < prev ${prevProtein})`)
    prevProtein = score
    console.log(`${v} servings → ${score}`)
  })
  
  console.log('\n=== PROCESSED FOOD (penalty — score should DECREASE) ===')
  const processedVals = ['none(0)', 'little(1)', 'some(2)', 'a lot(3)', 'a ton(5)']
  const processedAmts = [0, 1, 2, 3, 5]
  let prevProcessed = 101
  processedAmts.forEach((v, i) => {
    const score = calcNutritionFromServings({ fruit_servings: 3, vegetable_servings: 4, protein_servings: 3, processed_servings: v })
    checkRange(`nutrition(processed=${v})`, score)
    assert(score <= prevProcessed, `processed penalty should be monotonic non-increasing (${v}: ${score} > prev ${prevProcessed})`)
    prevProcessed = score
    console.log(`${processedVals[i]} → ${score}`)
  })
  // Explicit check: one processed item should NOT destroy the score
  const zeroProcessed = calcNutritionFromServings({ fruit_servings: 3, vegetable_servings: 4, protein_servings: 3, processed_servings: 0 })
  const oneProcessed  = calcNutritionFromServings({ fruit_servings: 3, vegetable_servings: 4, protein_servings: 3, processed_servings: 1 })
  assert(oneProcessed >= zeroProcessed * 0.5, `one processed item should not destroy the score (0: ${zeroProcessed}, 1: ${oneProcessed})`)
  
  console.log('\n=== FOCUS (minutes, reading=0, meditation=0) ===')
  const focusVals = [0, 15, 30, 60, 90, 120, 150, 180, 240]
  let prevFocus = -1
  focusVals.forEach((m) => {
    const score = calcFocusScore({ focus_minutes: m, reading_minutes: 0, meditation_minutes: 0 })
    checkRange(`focus(${m}min)`, score)
    assert(score >= prevFocus, `focus score should be monotonic non-decreasing (${m}min: ${score} < prev ${prevFocus})`)
    prevFocus = score
    console.log(`${m} min → ${score}`)
  })
  assert(
    calcFocusScore({ focus_minutes: 140, reading_minutes: 0, meditation_minutes: 0 }) < 60,
    '140 minutes of focus alone should NOT approach 100'
  )
  
  console.log('\n=== WORKOUT (duration + type) ===')
  const workoutTests = [
    ['gym', 0], ['gym', 15], ['gym', 30], ['gym', 45], ['gym', 60], ['gym', 90], ['gym', 120], ['gym', 180],
    ['run', 30], ['run', 60], ['run', 120],
    ['yoga', 30], ['yoga', 60],
    ['sport', 45], ['sport', 90],
  ]
  workoutTests.forEach(([type, duration]) => {
    const score = calcFitnessFromWorkout({ exercise_type: type, workout_duration_min: duration })
    checkRange(`fitness(${type}, ${duration}min)`, score)
    console.log(`${type}, ${duration}min → ${score}`)
  })
  // Monotonic within same type
  let prevGym = -1
  ;[0, 15, 30, 45, 60, 90, 120, 180].forEach((d) => {
    const score = calcFitnessFromWorkout({ exercise_type: 'gym', workout_duration_min: d })
    assert(score >= prevGym, `gym fitness score should be monotonic non-decreasing (${d}min: ${score} < prev ${prevGym})`)
    prevGym = score
  })
  
  console.log('\n=== HYDRATION (water_ml) ===')
  const waterVals = [0, 500, 1000, 1500, 2000, 2500, 3000, 3200, 4000]
  let prevWater = -1
  waterVals.forEach((ml) => {
    const score = calcHydrationScore({ water_ml: ml })
    checkRange(`hydration(${ml}ml)`, score)
    assert(score >= prevWater, `hydration score should be monotonic non-decreasing (${ml}ml: ${score} < prev ${prevWater})`)
    prevWater = score
    console.log(`${ml}ml → ${score}`)
  })
  
  console.log('\n=== 100-IS-RARE CHECK ===')
  // A very strong but not literally-perfect day should land well under 100
  // on each pillar.
  const strongDay = {
    fruit_servings: 4, vegetable_servings: 5, protein_servings: 4, processed_servings: 0,
    water_ml: 3000, exercise_type: 'gym', workout_duration_min: 60,
    sleep_hours: 8, sleep_quality: 8, focus_minutes: 90, reading_minutes: 20, meditation_minutes: 10,
  }
  const nutritionStrong = calcNutritionFromServings(strongDay, [])
  const fitnessStrong   = calcFitnessFromWorkout(strongDay)
  const sleepStrong     = calcSleepScore(strongDay)
  const focusStrong     = calcFocusScore(strongDay)
  console.log(`Strong (not extreme) day — Nutrition: ${nutritionStrong}, Fitness: ${fitnessStrong}, Sleep: ${sleepStrong}, Focus: ${focusStrong}`)
  assert(nutritionStrong < 65, `strong-day nutrition should stay under 65 without food-quality logging (got ${nutritionStrong})`)
  assert(fitnessStrong < 90, `strong-day fitness (60min gym) should stay under 90 (got ${fitnessStrong})`)
  
  console.log('\n=== SUMMARY ===')
  if (failures === 0) {
    console.log('✅ All checks passed.')
  } else {
    console.log(`❌ ${failures} check(s) failed.`)
    process.exit(1)
  }