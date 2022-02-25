it('loads home page', () => {
	cy.visit('/')
	cy.contains('picili')
})
