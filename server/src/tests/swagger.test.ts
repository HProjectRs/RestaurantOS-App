const { swaggerSpec } = require('../swagger')

describe('Swagger Documentation', () => {
  it('should generate a valid swagger spec', () => {
    expect(swaggerSpec).toBeDefined()
    expect(swaggerSpec.info.title).toBe('RestaurantOS API')
    expect(swaggerSpec.info.version).toBe('1.0.0')
    expect(swaggerSpec.paths).toBeDefined()
    expect(Object.keys(swaggerSpec.paths).length).toBeGreaterThan(0)
  })

  it('should contain essential paths', () => {
    expect(swaggerSpec.paths['/auth/login']).toBeDefined()
    expect(swaggerSpec.paths['/menu']).toBeDefined()
    expect(swaggerSpec.paths['/orders']).toBeDefined()
    expect(swaggerSpec.paths['/health']).toBeDefined()
  })

  it('should define critical schemas', () => {
    const schemas = swaggerSpec.components.schemas
    expect(schemas.MenuItem).toBeDefined()
    expect(schemas.Order).toBeDefined()
    expect(schemas.User).toBeDefined()
  })
})
