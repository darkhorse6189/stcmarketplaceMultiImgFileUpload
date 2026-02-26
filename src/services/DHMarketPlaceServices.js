import axios from "axios";

const contextPath = "https://stc-backend-0-rahul-uideployment.apps.nprdc-ocp.dhdigital.co.in/camel/api/dhmarketplace/stc/v1/";

class DHMarketPlaceService {

  addProduct(newProductData) {
    const productCreationRequestPayLoad = {
      ProductCreationRequest: {
        ...newProductData,
      },
    };
    return axios.post(
      contextPath + "AddProduct",
      productCreationRequestPayLoad,
    );
  }

}

const dhmarketplaceServiceInstance = new DHMarketPlaceService();
export default dhmarketplaceServiceInstance;