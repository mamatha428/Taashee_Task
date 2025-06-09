package com.bazello.productmanagement.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import com.bazello.productmanagement.DTO.BasicProductDetails;

import com.bazello.productmanagement.DTO.ProductStep2ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep3Request;
import com.bazello.productmanagement.DTO.ProductStep4Request;
import com.bazello.productmanagement.DTO.ProductStep4ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep6ResponseDTO;
import com.bazello.productmanagement.DTO.ProductSummaryDTO;
import com.bazello.productmanagement.DTO.Step6RequestPayload;
import com.bazello.productmanagement.entity.Product;
import com.bazello.productmanagement.entity.embedded.Category;
import com.bazello.productmanagement.entity.embedded.GroupBuySlab;
import com.bazello.productmanagement.service.impl.ProductFilterRequest;

public interface ProductService {

	Product saveStep1(BasicProductDetails product);

	Product updateStep1(String productId, BasicProductDetails product) throws Exception;

	Optional<Product> getByProductId(String productId) throws Exception;
	
	Category createCategory(Category request);

	List<Category> getCategoriesByParentId(String parentId);

	void saveProductOnboardingStep2(String productId, Product product, List<MultipartFile> images, MultipartFile video);

	ProductStep2ResponseDTO getStep2Details(String productId);

	Category getCategoryById(String id);
	
	
	
	void updateProductDetails(String productId, ProductStep3Request updateRequest);
	 
    ProductStep3Request getProductDetails(String productId);
    
    Product updatePricingStep(String productId, ProductStep4Request request) throws Exception;

	List<GroupBuySlab> generateGroupBuyTiers(double regularPrice, double discountPercentage, int tierCount);
	
	ProductStep4ResponseDTO getProductStep4Details(String productId);
	
	String getCategoryByProductId(String productId);


    

	int getCurrentStep(String productId);
	
	//Page<ProductSummaryDTO> getAllProductsByMerchantId(String merchantId, int page, int size);
	
	Page<ProductSummaryDTO> getAllProductsByMerchantId(String merchantId, int page, int size,String filterName, List<String> selectedBrands, List<String> selectedStatuses,List<String>categoryIds);

	
	Product saveProductOnboardingStep6(String productId, Step6RequestPayload product) throws Exception;
	ProductStep6ResponseDTO getStep6Details(String productId);

	List<Product> getAllProducts();
	
	Page<Product> getAllPageProducts(Pageable pageable);
	
	

	Map<String, Object> getVariantsAndDetailsById(String id);

	void updateVariantsCount(String productId, Map<String, List<String>> variantsCount);

	Category getCategoryDetails(String id);

	Category updateCategory(Category request, String categoryId);

	Category getCategoryDetailsByCategoryId(String categoryId);

	List<Category> getAllCategoriesWhoseParentIsNull();

	List<Category> getAllCategories();

	Page<ProductSummaryDTO> getFilteredProducts(ProductFilterRequest request);
}
