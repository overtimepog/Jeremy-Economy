const { ITEM_TYPES } = require('../../resources/constants')
const ITEMS_PER_PAGE = 9

module.exports = {
	name: 'blackmarket',
	aliases: ['bm'],
	description: 'Search for Black Market listings by other players.',
	long: 'Search the Black Market for item listings.\n\nThe Black Market is a shop where players can list their own items for their own price and anyone can buy them using the `buy` command. You can also search the black market here: https://lootcord.com/blackmarket',
	args: { 'item/category': 'Item or category to search for. Possible categories: ranged, melee, items, ammo, materials, storage, banners' },
	examples: ['blackmarket assault_rifle', 'blackmarket ranged', 'blackmarket items'],
	ignoreHelp: false,
	requiresAcc: true,
	requiresActive: false,
	guildModsOnly: false,

	async execute(app, message, { args, prefix }) {
		const category = args[0] || ''
		const item = app.parse.items(args)[0]

		if (Object.keys(ITEM_TYPES).includes(category.toLowerCase())) {
			const filteredItems = Object.keys(app.itemdata).filter(itm => app.itemdata[itm].category === ITEM_TYPES[category.toLowerCase()].type)
			const listings = await app.query('SELECT * FROM blackmarket WHERE itemName IN (?) ORDER BY pricePer ASC LIMIT 18', [filteredItems])

			if (listings.length <= ITEMS_PER_PAGE) {
				return message.channel.createMessage(generateCategoryPages(app, prefix, listings, ITEM_TYPES[category.toLowerCase()].name)[0])
			}

			app.react.paginate(message, generateCategoryPages(app, prefix, listings, ITEM_TYPES[category.toLowerCase()].name), 30000)
		}
		else if (item) {
			const listings = await app.query('SELECT * FROM blackmarket WHERE itemName = ? ORDER BY pricePer ASC LIMIT 18', [item])
			const stats = (await app.query('SELECT AVG(price / quantity) AS averagePrice, SUM(quantity) AS amountSold FROM blackmarket_transactions WHERE itemName = ? AND soldDate > NOW() - INTERVAL 14 DAY', [item]))[0]

			if (listings.length <= ITEMS_PER_PAGE) {
				return message.channel.createMessage(generatePages(app, prefix, listings, stats, item)[0])
			}

			app.react.paginate(message, generatePages(app, prefix, listings, stats, item), 30000)
		}
		else {
			const listings = await app.query('SELECT * FROM blackmarket ORDER BY RAND() LIMIT 9')

			const embed = new app.Embed()
				.setTitle('🛒 Random Black Market Listings')
				.setDescription(`These listings were made by other players!\nPurchase one with \`${prefix}buy <Listing ID>\` command (ex. \`j.buy Jq0cG_YY\`)\n\n**Search for items with \`${prefix}bm <item to search>\`**`)
				.setColor(13451564)

			app.bm.displayListings(embed, listings)

			message.channel.createMessage(embed)
		}
	}
}

function generatePages(app, prefix, listings, stats, item) {
	const maxPage = Math.ceil(listings.length / ITEMS_PER_PAGE) || 1
	const pages = []

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
		const indexLast = ITEMS_PER_PAGE * i
		const selectedListings = listings.slice(indexFirst, indexLast)

		const statsPhrase = `__**Recent Market Statistics**__\nAmount Sold: ${stats.amountSold || 0}\nAverage Price: ${stats.averagePrice ? app.common.formatNumber(stats.averagePrice) : 'Unknown'}`

		const pageEmbed = new app.Embed()
			.setTitle(`Black Market Listings for: ${app.itemdata[item].icon}${item}`)
			.setDescription(`These listings were made by other players!\nPurchase one with \`${prefix}buy <Listing ID>\` command (ex. \`j.buy Jq0cG_YY\`)\n\n${statsPhrase}\n\n**Sorted lowest price to highest:**`)
			.setColor(13451564)

		app.bm.displayListings(pageEmbed, selectedListings)

		pages.push(pageEmbed)
	}

	return pages
}

function generateCategoryPages(app, prefix, listings, category) {
	const maxPage = Math.ceil(listings.length / ITEMS_PER_PAGE) || 1
	const pages = []

	for (let i = 1; i < maxPage + 1; i++) {
		const indexFirst = (ITEMS_PER_PAGE * i) - ITEMS_PER_PAGE
		const indexLast = ITEMS_PER_PAGE * i
		const selectedListings = listings.slice(indexFirst, indexLast)

		const pageEmbed = new app.Embed()
			.setTitle(`Black Market Listings for: ${category}`)
			.setDescription(`These listings were made by other players!\nPurchase one with \`${prefix}buy <Listing ID>\` command (ex. \`j.buy Jq0cG_YY\`)\n\n**Sorted lowest price to highest:**`)
			.setColor(13451564)

		app.bm.displayListings(pageEmbed, selectedListings)

		pages.push(pageEmbed)
	}

	return pages
}
