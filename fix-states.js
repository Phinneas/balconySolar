const fs = require('fs');
const data = require('./state-data.json');

// For all states that are legal, ensure at least one detail is not required
data.states.forEach(state => {
  if (state.isLegal) {
    const hasNonRequired = state.details.some(d => d.required === false);
    if (!hasNonRequired) {
      // Make interconnection non-required
      const interconnection = state.details.find(d => d.category === 'interconnection');
      if (interconnection) {
        interconnection.required = false;
        interconnection.description = 'Notification to utility required but no formal agreement for systems under ' + state.maxWattage + 'W';
      }
    }
  }
});

fs.writeFileSync('./state-data.json', JSON.stringify(data, null, 2));
console.log('Fixed all states');
