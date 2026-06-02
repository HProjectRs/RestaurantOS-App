export function calcIRG(grossSalary) {
  if (grossSalary <= 500) return 0;
  if (grossSalary <= 1500) return (grossSalary - 500) * 0.15;
  if (grossSalary <= 3000) return 150 + (grossSalary - 1500) * 0.25;
  return 525 + (grossSalary - 3000) * 0.35;
}

export function calcCNAS(grossSalary) {
  return grossSalary * 0.09;
}

export function calcFoodCost(recipeCost, sellingPrice) {
  if (!sellingPrice) return 0;
  return (recipeCost / sellingPrice) * 100;
}

export function calcPrimeCost(foodCost, laborCost, revenue) {
  if (!revenue) return 0;
  return ((foodCost + laborCost) / revenue) * 100;
}

export function calcProfitMargin(revenue, cost) {
  if (!revenue) return 0;
  return ((revenue - cost) / revenue) * 100;
}
