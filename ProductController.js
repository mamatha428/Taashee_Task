package com.bazello.productmanagement.controller;

import java.time.LocalDateTime;
import java.util.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bazello.productmanagement.DTO.BasicProductDetails;

import com.bazello.productmanagement.DTO.GroupBuyPricingResponse;
import com.bazello.productmanagement.DTO.ProductStep2ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep3Request;
import com.bazello.productmanagement.DTO.ProductStep4Request;
import com.bazello.productmanagement.DTO.ProductStep4ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep6ResponseDTO;
import com.bazello.productmanagement.DTO.ProductSummaryDTO;
import com.bazello.productmanagement.DTO.Step6RequestPayload;
import com.bazello.productmanagement.DTO.TierPricingRequest;
import com.bazello.productmanagement.entity.Product;
import com.bazello.productmanagement.entity.embedded.Category;
import com.bazello.productmanagement.entity.embedded.GroupBuySlab;
import com.bazello.productmanagement.service.ProductService;
import com.bazello.productmanagement.service.impl.ProductFilterRequest;
import com.bazello.productmanagement.utils.StandardResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
public class ProductController {

	private final ProductService productService;

	private final MongoTemplate mongoTemplate;

	private final ObjectMapper objectMapper = new ObjectMapper();

	ProductController(ProductService productService, MongoTemplate mongoTemplate) {
		this.productService = productService;

		this.mongoTemplate = mongoTemplate;
	}

	@PostMapping("/basic-details")
	public ResponseEntity<StandardResponse<Product>> saveStep1(@RequestBody BasicProductDetails basicProductDetails,
			HttpServletRequest request) {
		Product created = productService.saveStep1(basicProductDetails);
		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Product created successfully", created));
	}

	@PutMapping("/basic-details/{productId}")
	public ResponseEntity<StandardResponse<Product>> updateBasicDetails(@PathVariable String productId,
			@RequestBody BasicProductDetails basicProductDetails, HttpServletRequest request) throws Exception {
		Product updated = productService.updateStep1(productId, basicProductDetails);
		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Product basic details updated successfully", updated));
	}

	@PutMapping("/{productId}/steps/{stepNo}")
	public ResponseEntity<StandardResponse<Product>> updateStep(@PathVariable String productId,
			@PathVariable String stepNo, @RequestBody BasicProductDetails basicProductDetails,
			HttpServletRequest request) throws Exception {
		Product updated = productService.updateStep1(productId, basicProductDetails);
		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Product step " + stepNo + " updated successfully", updated));
	}

	@GetMapping("/{productId}")
	public ResponseEntity<StandardResponse<Product>> getProduct(@PathVariable String productId,
			HttpServletRequest request) throws Exception {
		Optional<Product> optionalProduct = productService.getByProductId(productId);

		Product product = optionalProduct.get();
		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Product details fetched successfully", product));
	}

	private String getCurrentTimestamp() {
		return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
	}

	@PostMapping("/add-category")
	public ResponseEntity<?> createCategory(@RequestBody Category request, HttpServletRequest path) {
		Category category = productService.createCategory(request);
		StandardResponse<Category> res = new StandardResponse(path.getRequestURI(), "Category added successfully",
				category);
		return ResponseEntity.ok(res);

	}
	@PutMapping("/update-category/{categoryId}")
	public ResponseEntity<?> updateCategory(@RequestBody Category request, @PathVariable String categoryId, HttpServletRequest path) {
		Category category = productService.updateCategory(request,categoryId);
		StandardResponse<Category> res = new StandardResponse(path.getRequestURI(), "Category updated successfully",
				category);
		return ResponseEntity.ok(res);

	}
	 
	  
	 
	@GetMapping("/get-category-details-by-categoryid/{categoryId}")
	public ResponseEntity<?> getCategoryDetailsByCategoryId( @PathVariable String categoryId, HttpServletRequest path) {
		Category category = productService.getCategoryDetailsByCategoryId(categoryId);
		StandardResponse<Category> res = new StandardResponse(path.getRequestURI(), "Category details fetched successfully",
				category);
		return ResponseEntity.ok(res);

	}
	@GetMapping("/get-all-categories")
	public ResponseEntity<?> getAllCategories(  HttpServletRequest path) {
		List<Category> categories = productService.getAllCategories();
		StandardResponse<List<Category>> res = new StandardResponse(path.getRequestURI(), "Category details fetched successfully",
				categories);
		return ResponseEntity.ok(res);

	}

	@GetMapping("/get-categories/{parentId}")
	public ResponseEntity<?> getCategory(@PathVariable String parentId, HttpServletRequest request) {

		List<Category> categoreis = productService.getCategoriesByParentId(parentId);
		StandardResponse<List<Category>> res = new StandardResponse(request.getRequestURI(),
				"Successfully fetched Products", categoreis);

		return ResponseEntity.ok(res);

	}
	//getting all the root categories
	@GetMapping("/get-root-categories")
	public ResponseEntity<StandardResponse<List<Category>>> getCategories(HttpServletRequest request){
		List<Category> categories=productService.getAllCategoriesWhoseParentIsNull();
		StandardResponse<List<Category>>response=new StandardResponse<>(request.getRequestURI(),"categories fetched successfully",categories);
		return ResponseEntity.ok(response);
	}

	@PutMapping(value = "/onboarding/step-2/{productId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> productOnboardingStep2(@RequestPart("product") String productJson,
			@RequestPart(value = "images", required = false) List<MultipartFile> images,
			@RequestPart(value = "video", required = false) MultipartFile video, @PathVariable String productId,
			HttpServletRequest request) throws JsonMappingException, JsonProcessingException {

		Product product = objectMapper.readValue(productJson, Product.class);
		productService.saveProductOnboardingStep2(productId, product, images, video);
		StandardResponse<?> res = new StandardResponse(request.getRequestURI(),
				"Successfully completed prodct onboarding step 2", null);

		return ResponseEntity.ok(res);

	}

	@GetMapping("/getStep-2-Details/{productId}")
	public ResponseEntity<?> getStep2Details(@PathVariable String productId, HttpServletRequest request) {
		ProductStep2ResponseDTO step2Details = productService.getStep2Details(productId);
		StandardResponse<ProductStep2ResponseDTO> response = new StandardResponse(request.getRequestURI(),
				"Successfully fetched Products", step2Details);
		return ResponseEntity.ok(response);
	}

	@PutMapping("/update-step3-details/{productId}")
	public ResponseEntity<StandardResponse<String>> updateProductDetails(@PathVariable String productId,
			@Valid @RequestBody ProductStep3Request updateRequest, HttpServletRequest request) {

		productService.updateProductDetails(productId, updateRequest);

		StandardResponse<String> response = new StandardResponse<>(request.getRequestURI(),
				"Product details updated successfully.", null // Or return a success message/data if needed
		);

		return ResponseEntity.ok(response);
	}

	@GetMapping("/get-step3-details/{productId}")
	public ResponseEntity<StandardResponse<ProductStep3Request>> getProductDetails(@PathVariable String productId,
			HttpServletRequest request) {

		ProductStep3Request productDetails = productService.getProductDetails(productId);

		StandardResponse<ProductStep3Request> response = new StandardResponse<>(request.getRequestURI(),
				"Product details fetched successfully.", productDetails);

		return ResponseEntity.ok(response);
	}

	@GetMapping("/get-category-details/{id}")
	public ResponseEntity<?> getCategoryDetails(@PathVariable String id, HttpServletRequest request) {
		Category category = productService.getCategoryDetails(id);
		StandardResponse<Category> response = new StandardResponse<>(request.getRequestURI(),
				"Successfully fetched category details", category);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/get-current-step/{productId}")
	public ResponseEntity<StandardResponse<Map<String, Integer>>> getCurrentStep(@PathVariable String productId,
			HttpServletRequest request) {
		int currentStep = productService.getCurrentStep(productId);

		Map<String, Integer> responseData = new HashMap<>();
		responseData.put("currentStep", currentStep);

		StandardResponse<Map<String, Integer>> response = new StandardResponse<>(request.getRequestURI(),
				"Current step fetched successfully.", responseData);

		return ResponseEntity.ok(response);
	}

	@PutMapping("/step4-pricing/{productId}")
	public ResponseEntity<StandardResponse<Product>> updateStep4Pricing(@PathVariable String productId,
			@RequestBody ProductStep4Request request, HttpServletRequest httpRequest) throws Exception {

		Product updatedProduct = productService.updatePricingStep(productId, request);

		StandardResponse<Product> response = new StandardResponse<>(httpRequest.getRequestURI(),
				"Step 4 pricing updated successfully", updatedProduct);

		return ResponseEntity.ok(response);
	}

	@PostMapping("/group-buy/pricing-tiers")
	public ResponseEntity<StandardResponse<GroupBuyPricingResponse>> getGroupBuyTiers(
			@RequestBody TierPricingRequest request, HttpServletRequest httpRequest) {

		String categoryId = productService.getCategoryByProductId(request.getProductId());
		System.out.println("CATEGORY ID" + categoryId);
		System.out.println("AFTER CATEGORY");
		if (categoryId.equals(null)) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(new StandardResponse<>(httpRequest.getRequestURI(), "Category not found for product", null));
		}

		Category category = productService.getCategoryById(categoryId);

		System.out.println(category);
		if (category == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body(new StandardResponse<>(httpRequest.getRequestURI(), "Category not found for product", null));
		}

		List<GroupBuySlab> slabs = productService.generateGroupBuyTiers(request.getRegularPrice(),
				category.getMinSlabDiscount(), request.getTierCount());

		GroupBuyPricingResponse responsePayload = new GroupBuyPricingResponse(request.getRegularPrice(),
				category.getMinSlabDiscount(), slabs, request.getAvailableStock());

		return ResponseEntity
				.ok(new StandardResponse<>(httpRequest.getRequestURI(), "Group buy slabs generated", responsePayload));
	}

	@GetMapping("/get-step4-details/{productId}")
	public ResponseEntity<StandardResponse<ProductStep4ResponseDTO>> getStep4ProductDetails(
			@PathVariable String productId, HttpServletRequest request) {

		ProductStep4ResponseDTO productDetails = productService.getProductStep4Details(productId);

		StandardResponse<ProductStep4ResponseDTO> response = new StandardResponse<>(request.getRequestURI(),
				"Product details fetched successfully.", productDetails);

		return ResponseEntity.ok(response);
	}

	@PostMapping("/update-leaf-categories")
	public ResponseEntity<?> updateLeafCategories() 
	{
		Query query = new Query(Criteria.where("level").is(4));

		Update update = new Update().set("discount", 5);

		mongoTemplate.updateMulti(query, update, Category.class);

		return ResponseEntity.ok("Leaf categories updated with discount and basePrice");
	}

//	@GetMapping("/get-all-products-by-merchant/{merchantId}")
//	public ResponseEntity<StandardResponse<Page<ProductSummaryDTO>>> getAllProductsByMerchant(
//			@PathVariable String merchantId, @RequestParam(defaultValue = "0") int page,
//			@RequestParam(defaultValue = "10") int size, HttpServletRequest request) {
//		Page<ProductSummaryDTO> pagedProducts = productService.getAllProductsByMerchantId(merchantId, page, size);
//		StandardResponse<Page<ProductSummaryDTO>> response = new StandardResponse<>(request.getRequestURI(),
//				"Fetched products successfully", pagedProducts);
//		return ResponseEntity.ok(response);
//	}

	@GetMapping("/get-all-products-by-merchant/{merchantId}")
	public ResponseEntity<StandardResponse<Page<ProductSummaryDTO>>> getAllProductsByMerchant(
			@PathVariable String merchantId, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size, @RequestParam(required = false) String filterName,
			@RequestParam(required = false) List<String> selectedBrands,
			@RequestParam(required = false) List<String> selectedStatuses,
			 @RequestParam(required=false) List<String>categoryIds, HttpServletRequest request) {
		//System.err.println("Filtername in called controller / " + filterName);
		Page<ProductSummaryDTO> pagedProducts = productService.getAllProductsByMerchantId(merchantId, page, size,
				filterName, selectedBrands, selectedStatuses,categoryIds);
		StandardResponse<Page<ProductSummaryDTO>> response = new StandardResponse<>(request.getRequestURI(),
				"Fetched products successfully", pagedProducts);
		return ResponseEntity.ok(response);
	}

	@PutMapping("/update-details/step-6/{productId}")
	public ResponseEntity<?> productOnboardingStep6(@RequestBody Step6RequestPayload productDetials,
			@PathVariable String productId, HttpServletRequest request) throws Exception {

		System.err.println("step6 details " + productDetials);
		Product product = productService.saveProductOnboardingStep6(productId, productDetials);
		StandardResponse<?> res = new StandardResponse(request.getRequestURI(),
				"Successfully completed prodct onboarding step 6", product);

		return ResponseEntity.ok(res);

	}

	@GetMapping("/get-step-6-Details/{productId}")
	public ResponseEntity<?> getStep6Details(@PathVariable String productId, HttpServletRequest request) {
		ProductStep6ResponseDTO step6Details = productService.getStep6Details(productId);
		StandardResponse<ProductStep2ResponseDTO> response = new StandardResponse(request.getRequestURI(),
				"Successfully fetched product details", step6Details);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/products")
	public ResponseEntity<StandardResponse<List<Product>>> getAllProducts(HttpServletRequest request) throws Exception {

		List<Product> products = productService.getAllProducts();
		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Products details fetched successfully", products));
	}

	@GetMapping("/pagination-products")
	public ResponseEntity<StandardResponse<Page<Product>>> getAllProducts(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "10") int size, HttpServletRequest request) throws Exception {

		Page<Product> paginatedProducts = productService.getAllPageProducts(PageRequest.of(page, size));

		if (page >= paginatedProducts.getTotalPages() && paginatedProducts.getTotalElements() > 0) {
			throw new IllegalArgumentException("Requested page number exceeds total pages.");
		}

		return ResponseEntity.ok(new StandardResponse<>(getCurrentTimestamp(), request.getRequestURI(),
				"Product details fetched successfully", paginatedProducts));
	}
	



	@GetMapping("category/variants-info/{id}")
	public ResponseEntity<?> getVariantsAndDetails(@PathVariable String id, HttpServletRequest path) {
		Map<String, Object> response = productService.getVariantsAndDetailsById(id);
		if (response == null) {
			return ResponseEntity.notFound().build();
		}
		StandardResponse<Category> res = new StandardResponse(path.getRequestURI(), "Variants fetched successfully",
				response);
		return ResponseEntity.ok(res);
	}
	
	@PostMapping("/get-products")
	public ResponseEntity<StandardResponse<Page<ProductSummaryDTO>>> getProducts(
	        @RequestBody ProductFilterRequest request,
	        HttpServletRequest httpRequest
	) {
	    Page<ProductSummaryDTO> pagedProducts = productService.getFilteredProducts(request);

	    StandardResponse<Page<ProductSummaryDTO>> response = new StandardResponse<>(
	            httpRequest.getRequestURI(),
	            "Fetched products successfully",
	            pagedProducts
	    );

	    return ResponseEntity.ok(response);
	}
}
