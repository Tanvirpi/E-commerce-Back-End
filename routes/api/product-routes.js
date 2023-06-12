const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// get all products
router.get('/',async (req, res) => {
  // find all products
  // be sure to include its associated Category and Product data
  try {
    const productData = await Product.findAll({
      include: [{ model:Category},{model:Tag, through:ProductTag}]
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
      include: [{ model: Tag, through:ProductTag  },Category]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', (req, res) => {

  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
    Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
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
