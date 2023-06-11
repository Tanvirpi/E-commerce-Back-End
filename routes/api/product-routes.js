const router = require('express').Router();
const { Product, Category, Product, ProductProduct } = require('../../models');

// get all products
router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Product data
  try {
    const productData = await Product.findAll({
      include: [{ model: Product, through:ProductProduct}]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Product data
  try {
    const productData = await Product.findByPk(req.params.id,{
      include: [{ model: Product, through:ProductProduct  }]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', (req, res) => {

  Product.create(req.body)
    .then((product) => {
      // if there's product products, we need to create pairings to bulk create in the ProductProduct model
      if (req.body.productIds.length) {
        const productProductIdArr = req.body.productIds.map((product_id) => {
          return {
            product_id: product.id,
            product_id,
          };
        });
        return ProductProduct.bulkCreate(productProductIdArr);
      }
      // if no product products, just respond
      res.status(200).json(product);
    })
    .then((productProductIds) => res.status(200).json(productProductIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', async(req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      // find all associated products from ProductProduct
      return ProductProduct.findAll({ where: { product_id: req.params.id } });
    })
    .then((productProducts) => {
      // get list of current product_ids
      const productProductIds = productProducts.map(({ product_id }) => product_id);
      // create filtered list of new product_ids
      const newProductProducts = req.body.productIds
        .filter((product_id) => !productProductIds.includes(product_id))
        .map((product_id) => {
          return {
            product_id: req.params.id,
            product_id,
          };
        });
      // figure out which ones to remove
      const productProductsToRemove = productProducts
        .filter(({ product_id }) => !req.body.productIds.includes(product_id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        ProductProduct.destroy({ where: { id: productProductsToRemove } }),
        ProductProduct.bulkCreate(newProductProducts),
      ]);
    })
    .then((updatedProductProducts) => res.json(updatedProductProducts))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id',async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id
      }
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with this id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
