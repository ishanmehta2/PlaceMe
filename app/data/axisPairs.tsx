// data/axisPairs.js
'use client'

export interface AxisPair {
    id: string
    left: string
    right: string
    category?: string
  }
  
  export const AXIS_PAIRS: AxisPair[] = [
    {
      id: 'hotdog-food',
      left: 'Hot dog is a Sandwich',
      right: 'Hot dog is a taco'
    },
    {
      id: 'earth-shape',
      left: 'Flat Earther',
      right: 'Round Earther'
    },
    {
      id: 'ai-impact',
      left: 'AI is our downfall',
      right: 'AI is our savior'
    },
    {
      id: 'digital-pets',
      left: 'Webkinz',
      right: 'Pokemon'
    },
    {
      id: 'movie-genre',
      left: 'Musical',
      right: 'Movie'
    },
    {
      id: 'retail-stores',
      left: '7Eleven',
      right: 'Target'
    },
    {
      id: 'hat-style',
      left: 'Top hat',
      right: 'flat top hat'
    },
    {
      id: 'study-music',
      left: 'Lofi Beats to Study To',
      right: 'Hyperpop to Disassociate To'
    },
    {
      id: 'grocery-stores',
      left: 'Trader Joe\'s',
      right: 'Costco'
    },
    {
      id: 'personality-types',
      left: 'Extrovert Who Thinks They\'re an Introvert',
      right: 'Introvert Who Pretends They\'re an Extrovert'
    },
    {
      id: 'water-debate',
      left: 'Water is wet',
      right: 'water is not wet'
    },
    {
      id: 'color-schemes',
      left: 'Neon colors',
      right: 'pastel colors'
    },
    {
      id: 'games',
      left: 'Video games',
      right: 'board games'
    },
    {
      id: 'kids-characters',
      left: 'Elmo',
      right: 'Cocomelon'
    },
    {
      id: 'sweet-treats',
      left: 'Candy',
      right: 'Slushy'
    },
    {
      id: 'car-cooling',
      left: 'Airconditioning in the car',
      right: 'Windows down'
    },
    {
      id: 'fashion-flex',
      left: 'Yeezys',
      right: 'Gucci Belt'
    },
    {
      id: 'relationship-energy',
      left: 'I can fix him',
      right: 'I can make him worse'
    },
    {
      id: 'food-safety',
      left: '"Is this gluten free?"',
      right: 'Eats hot dogs off the floor'
    },
    {
      id: 'story-role',
      left: 'Main Character',
      right: 'Background NPC'
    },
    {
      id: 'meme-icons',
      left: 'Grumpy Cat',
      right: 'Happy Harambe'
    },
    {
      id: 'life-choices',
      left: 'Let\'s gamble',
      right: 'Let\'s rob a bank'
    },
    {
      id: 'lifestyle',
      left: 'Wild and free',
      right: 'Calm and safe'
    },
    {
      id: 'tone',
      left: 'Funny',
      right: 'Serious'
    },
    {
      id: 'volume',
      left: 'Loud',
      right: 'Quiet'
    },
    {
      id: 'reality-tv',
      left: 'Love Island',
      right: 'Survivor'
    },
    {
      id: 'board-games',
      left: 'Checkers',
      right: 'Chess'
    },
    {
      id: 'romance-style',
      left: 'Secret Sneaky Link',
      right: 'Makeout in Public'
    },
    {
      id: 'drinkware',
      left: 'Waterbottle',
      right: 'Flask'
    },
    {
      id: 'substances',
      left: 'Mariajuana',
      right: 'Alcohol'
    },
    {
      id: 'rat-vibe',
      left: 'Rats are cute',
      right: 'Set up a trap'
    },
    {
      id: 'bathroom-humor',
      left: 'Urination',
      right: 'Defecation'
    },
    {
      id: 'intoxication',
      left: 'Green Out',
      right: 'Black Out'
    },
    {
      id: 'shopping-style',
      left: 'Lets Thrift',
      right: 'Lets go to the mall'
    },
    {
      id: 'coffee-shop',
      left: 'COHO',
      right: 'Starbucks'
    },
    {
      id: 'party-type',
      left: 'Kickback',
      right: 'Rager'
    },
    {
      id: 'sketch-shows',
      left: 'SNL',
      right: 'I Think You Should Leave'
    },
    {
      id: 'keyboard-sound',
      left: 'Typewriter',
      right: 'Silent Keyboard'
    },
    {
      id: 'laptop-brand',
      left: 'DELL',
      right: 'Mac'
    },
    {
      id: 'hair-holder',
      left: 'Claw clip',
      right: 'Hairtie'
    },
    {
      id: 'men-hairstyle',
      left: 'Man Bun',
      right: 'Buzz Cut'
    },
    {
      id: 'nervous-reaction',
      left: 'Nervous Shitter',
      right: 'Nervous Talker'
    },
    {
      id: 'makeup-style',
      left: 'Fake Eyelashes',
      right: 'Natural Face'
    },
    {
      id: 'cosmetic-choice',
      left: 'Botox',
      right: 'Lipfiller'
    },
    {
      id: 'priorities',
      left: 'Where\'s my vape',
      right: 'Where\'s my iPhone'
    },
    {
      id: 'aesthetic-type',
      left: 'iPhone Face',
      right: 'Renaissance Face'
    },
    {
      id: 'cooking-role',
      left: 'Cooks',
      right: 'Is Cooked'
    },
    {
      id: 'worldview',
      left: 'Physics is everything',
      right: 'Vibes are everything'
    },
    {
      id: 'eating-style',
      left: 'American eater (10 min)',
      right: 'European eater (8+ hours)'
    },
    {
      id: 'bag-choice',
      left: 'Breifcase',
      right: 'Backpack'
    },
    {
      id: 'science-role',
      left: 'Biologist',
      right: 'Biology exists?'
    },
    {
      id: 'toilet-culture',
      left: 'Toilet Tik Tok',
      right: 'Toilet Fliers'
    },
    {
      id: 'footwear',
      left: 'Clogs',
      right: 'Jordan\'s'
    },
    {
      id: 'sugar-dynamics',
      left: 'Sugar Momma',
      right: 'Sugar Baby'
    },
    {
      id: 'comedy-engagement',
      left: 'Watch Stand Up',
      right: 'Do Stand Up'
    }
  ]
  
  // Utility functions for working with axis pairs
  export const getRandomAxisPair = (): AxisPair => {
    const randomIndex = Math.floor(Math.random() * AXIS_PAIRS.length)
    return AXIS_PAIRS[randomIndex]
  }
  
  export const getAxisPairById = (id: string): AxisPair | undefined => {
    return AXIS_PAIRS.find(pair => pair.id === id)
  }
  
  export const getAllAxisPairs = (): AxisPair[] => {
    return [...AXIS_PAIRS]
  }
  
  // Get a random axis pair that hasn't been used recently
  export const getRandomUnusedAxisPair = (usedIds: string[] = []): AxisPair => {
    console.log('🎲 getRandomUnusedAxisPair called with usedIds:', usedIds)
    
    const availablePairs = AXIS_PAIRS.filter(pair => !usedIds.includes(pair.id))
    console.log('📊 Available pairs after filtering:', availablePairs.length, 'out of', AXIS_PAIRS.length)
    
    // If all pairs have been used, reset and use any pair
    if (availablePairs.length === 0) {
      console.log('⚠️ All pairs have been used, selecting from all pairs')
      return getRandomAxisPair()
    }
    
    const randomIndex = Math.floor(Math.random() * availablePairs.length)
    const selectedPair = availablePairs[randomIndex]
    console.log('✅ Selected pair:', selectedPair.id, '- Left:', selectedPair.left, 'Right:', selectedPair.right)
    
    return selectedPair
  }
  
  // Get two different random axis pairs
  export const getTwoDifferentAxisPairs = (usedIds: string[] = []): { vertical: AxisPair, horizontal: AxisPair } => {
    console.log('🎯 Getting two different axis pairs, usedIds:', usedIds)
    
    // Get first pair
    const verticalPair = getRandomUnusedAxisPair(usedIds)
    console.log('📍 Selected vertical pair:', verticalPair.id)
    
    // Get second pair, excluding the first one
    const excludeIds = [...usedIds, verticalPair.id]
    let horizontalPair = getRandomUnusedAxisPair(excludeIds)
    
    // Extra safety check - if they're the same, try again with more exclusions
    let attempts = 0
    while (horizontalPair.id === verticalPair.id && attempts < 10) {
      console.log(`🔄 Attempt ${attempts + 1}: Same pair selected, trying again...`)
      horizontalPair = getRandomUnusedAxisPair(excludeIds)
      attempts++
    }
    
    // Final check - if still the same, force select a different one
    if (horizontalPair.id === verticalPair.id) {
      console.log('🚨 Force selecting different horizontal pair')
      const differentPairs = AXIS_PAIRS.filter(pair => pair.id !== verticalPair.id)
      if (differentPairs.length > 0) {
        const randomIndex = Math.floor(Math.random() * differentPairs.length)
        horizontalPair = differentPairs[randomIndex]
      }
    }
    
    console.log('✅ Final selection - Vertical:', verticalPair.id, 'Horizontal:', horizontalPair.id)
    
    if (verticalPair.id === horizontalPair.id) {
      console.error('❌ STILL SAME PAIRS! This should not happen.')
      console.log('Available axis pairs:', AXIS_PAIRS.length)
      console.log('Used IDs:', usedIds)
    }
    
    return {
      vertical: verticalPair,
      horizontal: horizontalPair
    }
  }
  
  // Generate axis labels in the format expected by your Axis component
  export const generateAxisLabels = (axisPair: AxisPair) => {
    return {
      top: 'Wet Sock', // Keep existing top/bottom labels
      bottom: 'Dry Tongue',
      left: axisPair.left,
      right: axisPair.right,
      labelColors: {
        top: 'rgba(251, 207, 232, 0.95)', // Pink
        bottom: 'rgba(167, 243, 208, 0.95)', // Green
        left: 'rgba(221, 214, 254, 0.95)', // Purple
        right: 'rgba(253, 230, 138, 0.95)' // Yellow
      }
    }
  }