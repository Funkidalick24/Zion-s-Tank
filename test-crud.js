const { sequelize } = require('./src/database/connection');
const User = require('./src/models/user');
const Product = require('./src/models/product');

async function testCRUD() {
  try {
    console.log('Testing CRUD operations...');

    // Test CREATE - Create a user
    console.log('Creating a test user...');
    const timestamp = Date.now();
    const user = await User.create({
      email: `test${timestamp}@example.com`,
      passwordHash: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      role: 'buyer'
    });
    console.log('User created:', user.id);

    // Test READ - Find the user
    console.log('Reading the user...');
    const foundUser = await User.findByPk(user.id);
    console.log('User found:', foundUser.email);

    // Test UPDATE - Update the user
    console.log('Updating the user...');
    await foundUser.update({ first_name: 'UpdatedTest' });
    console.log('User updated:', foundUser.first_name);

    // Test CREATE - Create a product
    console.log('Creating a test product...');
    const product = await Product.create({
      sellerId: user.id,
      name: 'Test Product',
      description: 'A test product',
      price: 10.99
    });
    console.log('Product created:', product.id);

    // Test READ - Find products
    console.log('Reading products...');
    const products = await Product.findAll({ where: { seller_id: user.id } });
    console.log('Products found:', products.length);

    // Test UPDATE - Update the product
    console.log('Updating the product...');
    await product.update({ price: 15.99 });
    console.log('Product updated:', product.price);

    // Test DELETE - Delete the product
    console.log('Deleting the product...');
    await product.destroy();
    console.log('Product deleted');

    // Test DELETE - Delete the user
    console.log('Deleting the user...');
    await user.destroy();
    console.log('User deleted');

    console.log('CRUD operations completed successfully.');
  } catch (error) {
    console.error('Error during CRUD testing:', error);
  } finally {
    await sequelize.close();
  }
}

testCRUD();