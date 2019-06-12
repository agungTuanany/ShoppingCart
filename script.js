// variables

const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

// cart
let cart =[];

// buttons
let buttonsDOM = [];

//getting the products
class Products{
  async getProducts(){
    try {
      let result = await fetch('products.json')
      let data = await result.json();
      let products = data.items;
      products = products.map(item =>{
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return{title, price, id, image};
      });
      return products;
    } catch (error) {
      console.log(error);
    }
  }
}

// display product / manipulate product
class UI{
  displayProducts(products){
    let result = '';
    products.forEach(product => {
      result +=`
          <!-- single product -->
          <article class='product'>
            <div class='img-container'>
              <img src=${product.image} alt='product' class='product-img'>
              <button class='bag-btn' data-id=${product.id}>
                <i class='fa fa-shopping-cart'></i>
                add to cart
              </button>
            </div>
            <h3>${product.title}</h3>
            <h4>$ ${product.price}</h4>
          </article>
          <!-- end of single product -->
      `;
    });
    productsDOM.innerHTML = result;
  }

  getBagButtons(){
    const buttons = [...document.querySelectorAll('.bag-btn')];
    buttonsDOM = buttons;
    buttons.forEach(button => {
      // dataset is from button attributes look at DOM
      let id = button.dataset.id;
      let inCart =cart.find(item => item.id === id);
      if(inCart) {
        button.innerText = "In Cart";
        button.disabled = true;
      }
      button.addEventListener('click',(event) => {
        event.target.innerText = 'In Cart';
        event.target.disabled = true;
        // get product from product base on id
        let cartItem = {...Storage.getProduct(id), amount: 1};
        // add product to the cart
        cart = [...cart, cartItem];
        // save cart into local storage
        Storage.saveCart(cart);
        // set cart values | 'this.' refer to inner class.
        this.setCartValues(cart);
        // display cart item
        this.addCartItem(cartItem);
        // show the cart
        this.showCart();
      });
    });
  }

  setCartValues(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;

    cart.map(item => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
    cartItems.innerText = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement('div');
    div.classList.add('cart-item');
    div.innerHTML = `
      <!-- cart item -->
      <img src=${item.image} alt='product'>
      <div>
        <h4>${item.title}</h4>
        <h5>$${item.price}</h5>
       <!-- data-id is for control functionality -->
        <span class='remove-item' data-id=${item.id}>remove</span>
      </div>
      <div>
        <i class='fa fa-chevron-up' data-id=${item.id}></i>
        <p class='item-amount'>${item.amount}</p>
        <i class='fa fa-chevron-down' data-id=${item.id}></i>
      </div>
      <!-- end of cart item -->
    `;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add('transparentBcg');
    cartDOM.classList.add('showCart');
  }

  setupAPP() {
    cart = Storage.getCart();
    this.setCartValues(cart);
    this.populateCart(cart);
    cartBtn.addEventListener('click', this.showCart);
    closeCartBtn.addEventListener('click', this.hideCart);

  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove('transparentBcg');
    cartDOM.classList.remove('showCart');
  }

  cartLogic() {
    /* hint for accessing method in the class.
      * using arrow function to referencing the cart in UI class if not we just
      * reference to the button only*/
    // clear cart button
    clearCartBtn.addEventListener('click', () => { this.clearCart(); });
    // cart functionality
    cartContent.addEventListener('click', event => {
      //console.log(event.target);
      if(event.target.classList.contains('remove-item')) {
        let removeItem = event.target; //console.log(removeItem);
        let id = removeItem.dataset.id; //console.log(removeItem.parentElement.parentElement);
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if(event.target.classList.contains('fa-chevron-up')) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;//console.log(addAmount);
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValues(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if(event.target.classList.contains('fa-chevron-down')) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount =tempItem.amount - 1;
        if(tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValues(cart);
          lowerAmount.previousELementSibling.innerText = tempItem.amount;

        } else {
          cartContent.removeChild(lowerAmount.parentelement.parentElement);
          this.removeItem(id);
        }
      }

    });
  }

  clearCart() {
    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));

    // removing cart from the DOM
    while(cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    // update the value cart
    this.setCartValues(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class='fa fa-shopping-cart'></i>add to cart`;

  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }

}

// local storage
class Storage{
  static saveProducts(products){
    localStorage.setItem('products', JSON.stringify(products));
  }

  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem('products'));
    return products.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  static getCart() {
    return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
const ui = new UI();
const products = new Products();

  // Setup app
  ui.setupAPP();
  // get all products
  products.getProducts().then(products => {
    ui.displayProducts(products);
    Storage.saveProducts(products);
  }).then(() => {
    ui.getBagButtons();
    ui.cartLogic();
  });
});
