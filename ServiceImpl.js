package com.bazello.productmanagement.service.impl;

import java.awt.image.BufferedImage;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;

import javax.imageio.ImageIO;

import org.apache.commons.lang3.RandomStringUtils;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bazello.productmanagement.DTO.BasicProductDetails;

import com.bazello.productmanagement.DTO.MediaDTO;
import com.bazello.productmanagement.DTO.ProductStep2ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep3Request;
import com.bazello.productmanagement.DTO.ProductStep4Request;
import com.bazello.productmanagement.DTO.ProductStep4ResponseDTO;
import com.bazello.productmanagement.DTO.ProductStep6ResponseDTO;
import com.bazello.productmanagement.DTO.ProductSummaryDTO;
import com.bazello.productmanagement.DTO.Step6RequestPayload;
import com.bazello.productmanagement.entity.Product;
import com.bazello.productmanagement.entity.embedded.Category;
import com.bazello.productmanagement.entity.embedded.CategoryPath;
import com.bazello.productmanagement.entity.embedded.GroupBuySlab;
import com.bazello.productmanagement.entity.embedded.Media;
import com.bazello.productmanagement.entity.embedded.Metadata;
import com.bazello.productmanagement.entity.embedded.Pricing;
import com.bazello.productmanagement.entity.embedded.ShippingDetails;
import com.bazello.productmanagement.enums.ProductStatus;
import com.bazello.productmanagement.exceptions.InvalidPricingInputException;
import com.bazello.productmanagement.exceptions.ResourceNotFoundException;
import com.bazello.productmanagement.repository.CategoryRepository;
import com.bazello.productmanagement.repository.ProductRepository;
import com.bazello.productmanagement.repository.ProductRepositoryCustom;
import com.bazello.productmanagement.service.ProductService;
import com.mongodb.BasicDBObject;
import com.mongodb.client.gridfs.model.GridFSFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;


@Service
public class ProductServiceImpl implements ProductService {

	private final CategoryRepository categoryRepository;

	private final MongoTemplate mongoTemplate;

	private final ProductRepository productRepository;

	private final GridFsTemplate gridFsTemplate;
	
	ObjectMapper mapper = new ObjectMapper();

	@Autowired
	@Qualifier("productRepositoryCustomImpl")
	private ProductRepositoryCustom productRepositoryCustom;

	@Autowired
	ProductServiceImpl(GridFsTemplate gridFsTemplate, ProductRepository productRepository,
			CategoryRepository categoryRepository, MongoTemplate mongoTemplate) {
		this.categoryRepository = categoryRepository;
		this.mongoTemplate = mongoTemplate;
		this.gridFsTemplate = gridFsTemplate;
		this.productRepository = productRepository;
	}

	public Product saveStep1(BasicProductDetails basicProductDetails) {
		LocalDateTime currentDate = LocalDateTime.now();

		Metadata metadata = new Metadata(currentDate, currentDate);

		String generatedProductId = generateProductId();
		String generatedSlug = generateSlugBasedOnTitle(basicProductDetails.getTitle());

		Product product = Product.builder().productId(generatedProductId)
				.merchantId(basicProductDetails.getMerchantId()).currentStep(1).isCompleted(false)
				.title(basicProductDetails.getTitle()).description(basicProductDetails.getDescription())
				.slug(generatedSlug).brand(basicProductDetails.getBrand())
				.productSpecifications(basicProductDetails.getBulletPoints()).metadata(metadata).build();

		return productRepository.save(product);
	}

	private String generateSlugBasedOnTitle(String title) {
		if (title == null || title.trim().isEmpty()) {
			return "untitled";
		}

		// Convert to lowercase, replace non-alphanumeric characters with hyphens,
		// collapse multiple hyphens, and trim hyphens from ends
		String slug = title.toLowerCase().replaceAll("[^a-z0-9]", "-") // replace non-alphanumerics with "-"
				.replaceAll("-{2,}", "-") // collapse multiple "-"
				.replaceAll("^-|-$", ""); // trim starting or ending "-"

		return slug;
	}

	public Product updateStep1(String productId, BasicProductDetails incoming) throws Exception {

		Optional<Product> optionalProduct = productRepository.findByProductId(productId);

		if (!optionalProduct.isPresent()) {
			throw new Exception("Product not found for ID: " + productId);
		}

		Product existingProduct = optionalProduct.get();

		existingProduct.setTitle(incoming.getTitle());
		existingProduct.setSlug(incoming.getSlug());
		existingProduct.setDescription(incoming.getDescription());
		if (!existingProduct.isCompleted())
			existingProduct.setCurrentStep(1);

		return productRepository.save(existingProduct);
	}

	public Optional<Product> getByProductId(String productId) throws Exception {
		Optional<Product> optionalProduct = productRepository.findByProductId(productId);

		if (!optionalProduct.isPresent()) {
			throw new ResourceNotFoundException("Product not found for ID: " + productId);
		}
		return productRepository.findByProductId(productId);
	}

	private String generateProductId() {
		return "P-" + RandomStringUtils.random(12, true, true).toUpperCase();
	}

	@Override
	public Category createCategory(Category request) {
		Category category = new Category();
		category.setName(request.getName());
		category.setSlug(generateSlug(request.getName()));
		category.setLeaf(request.isLeaf());
		category.setAttributes(request.getAttributes());
		category.setSpecificInfo(request.getSpecificInfo());
		category.setMinSlabDiscount(request.getMinSlabDiscount());
		category.setMaxSlabDiscount(request.getMaxSlabDiscount());
		category.setRegularPrice(request.getRegularPrice());
		category.setVariants(request.getVariants());
		category.setDetails(request.getDetails());
		

		if (request.getParentId() != null) {
			Category parent = categoryRepository.findById(request.getParentId()).orElseThrow(
					() -> new ResourceNotFoundException("Parent category not found with ID: " + request.getParentId()));

			category.setLevel(parent.getLevel() + 1);
			category.setParentId(request.getParentId());

			List<CategoryPath> path = new ArrayList<>(parent.getPath());
			CategoryPath pathElement = new CategoryPath();
			pathElement.setId(parent.getId());
			pathElement.setName(parent.getName());
			pathElement.setSlug(parent.getSlug());

			path.add(pathElement);
			category.setPath(path);
			if (!path.isEmpty()) {
	            category.setRootId(path.get(0).getId());
	        }
		} else {
			category.setLevel(1);
			category.setRootId(null);
			category.setPath(new ArrayList<>());
		}

		return categoryRepository.save(category);
	}

	private String generateSlug(String name) {
		return name.toLowerCase().replaceAll("[^a-z0-9]+", "-");
	}

	@Override
	public List<Category> getCategoriesByParentId(String parentId) {
		try {
			Query query;

			if (parentId == null || parentId.trim().isEmpty() || Objects.equals(parentId, "null")) {
				query = new Query(Criteria.where("parentId").is(null));
			} else {

				if (!ObjectId.isValid(parentId)) {
					throw new IllegalArgumentException("Invalid parentId format");
				}
				 query = new Query(Criteria.where("parentId").is(parentId)); 
			}

			List<Category> categories = mongoTemplate.find(query, Category.class);

//			if (categories.isEmpty()) {
//				throw new ResourceNotFoundException("No categories found for parentId: " + parentId);
//			}

			return categories;
		} catch (IllegalArgumentException e) {
			throw e;
		} catch (ResourceNotFoundException e) {
			throw e;
		} catch (Exception e) {
			throw new RuntimeException("Unexpected error while fetching categories", e); // Generic, handled by
																							// Exception.class
		}
	}

	@Override
	public void saveProductOnboardingStep2(String productId, Product productData, List<MultipartFile> images,
			MultipartFile video) {
		List<Media> mediaList = new ArrayList<>();

		try {
			Optional<Product> optionalProduct = productRepository.findByProductId(productId);
			if (optionalProduct.isEmpty()) {
				throw new ResourceNotFoundException("No product found for productId: " + productId);
			}
			Product product = optionalProduct.get();
			// Process images
			if (images != null) {
				if (images.size() > 3) {
					throw new IllegalArgumentException("Max 3 images allowed.");
				}

				for (MultipartFile image : images) {
					String contentType = image.getContentType();
					if (!List.of("image/jpeg", "image/png").contains(contentType)) {
						throw new IllegalArgumentException("Only JPEG and PNG images allowed.");
					}

					if (image.getSize() > 5 * 1024 * 1024) {
						throw new IllegalArgumentException("Each image must be < 5MB.");
					}

					BufferedImage bufferedImage = ImageIO.read(image.getInputStream());
					if (bufferedImage == null) {
						throw new IllegalArgumentException("Invalid image file.");
					}

					int width = bufferedImage.getWidth();
					int height = bufferedImage.getHeight();
					if (width > 6000 || height > 6000) {
						throw new IllegalArgumentException("Image resolution must be <= 6000x6000.");
					}

					BasicDBObject meta = new BasicDBObject();
					meta.put("width", width);
					meta.put("height", height);
					meta.put("size", image.getSize());
					meta.put("type", contentType);
					meta.put("mediaType", "image");

					ObjectId gridFsId = gridFsTemplate.store(image.getInputStream(), image.getOriginalFilename(),
							contentType, meta);

					mediaList.add(Media.builder().name(image.getOriginalFilename()).type(contentType)
							.size(image.getSize()).width(width).height(height).filePath(gridFsId.toHexString())
							.mediaType("image").build());
				}
			}

			// Process video
			if (video != null) {
				if (!video.getContentType().startsWith("video/")) {
					throw new IllegalArgumentException("Only video files are allowed.");
				}

				if (video.getSize() > 50 * 1024 * 1024) {
					throw new IllegalArgumentException("Video must be < 50MB.");
				}

				BasicDBObject meta = new BasicDBObject();
				meta.put("size", video.getSize());
				meta.put("type", video.getContentType());
				meta.put("mediaType", "video");

				ObjectId gridFsId = gridFsTemplate.store(video.getInputStream(), video.getOriginalFilename(),
						video.getContentType(), meta);

				mediaList.add(Media.builder().name(video.getOriginalFilename()).type(video.getContentType())
						.size(video.getSize()).filePath(gridFsId.toHexString()).mediaType("video").width(0).height(0)
						.build());
			}

			// product.getMetadata().getCreatedAt();
			Metadata metaData = new Metadata(product.getMetadata().getCreatedAt(), LocalDateTime.now());
			product.setMetadata(metaData);
			product.setCategory(productData.getCategory());
			product.setHasVariants(productData.isHasVariants());
			product.setMedia(mediaList);
			if (!product.isCompleted())
				product.setCurrentStep(2);
			product.setCompleted(false);
			productRepository.save(product);

		} catch (Exception e) {
			throw new RuntimeException(e.getLocalizedMessage(), e);
		}
	}

	@Override
	public ProductStep2ResponseDTO getStep2Details(String productId) {
		System.err.println("enterdd into service impls: ");
		Optional<Product> optionalProduct = productRepository.findByProductId(productId);
		if (optionalProduct.isEmpty()) {
			throw new ResourceNotFoundException("Product not found with productId: " + productId);
		}

		Product product = optionalProduct.get();
		System.err.println("enterdd into service impls got product witht the id: ");
		List<MediaDTO> mediaDTOs = new ArrayList<>();
		if (product.getMedia() != null && product.getMedia().size() > 0) {
			for (Media media : product.getMedia()) {
				GridFSFile gridFSFile = gridFsTemplate
						.findOne(Query.query(Criteria.where("_id").is(new ObjectId(media.getFilePath()))));

				if (gridFSFile == null)
					continue;

				try (InputStream inputStream = gridFsTemplate.getResource(gridFSFile).getInputStream()) {
					byte[] fileBytes = inputStream.readAllBytes();
					String base64 = Base64.getEncoder().encodeToString(fileBytes);

					mediaDTOs.add(MediaDTO.builder().name(media.getName()).type(media.getType()).size(media.getSize())
							.width(media.getWidth()).height(media.getHeight()).mediaType(media.getMediaType())
							.base64Data(base64).build());
				} catch (Exception e) {
					throw new RuntimeException("Failed to read media file from GridFS", e);
				}
				System.err.println("enterdd into service impls completed convertion: ");
			}
		}
		System.err.println("prodcut category: " + product.getCategory());
		return ProductStep2ResponseDTO.builder().productId(product.getProductId()).hasVariants(product.isHasVariants())
				.category(product.getCategory()).media(mediaDTOs).build();
	}

	@Override
	public void updateProductDetails(String productId, ProductStep3Request updateRequest) {
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found with productId: " + productId));

		// Update fields
		product.setSearchKeywords(updateRequest.getSearchKeywords());
		product.setTags(updateRequest.getTags());
		product.setManufacturingDetails(updateRequest.getManufacturingDetails());
		product.setProductSpecificInfo(updateRequest.getProductSpecificInfo());
		product.setTaxDetails(updateRequest.getTaxDetails());
		product.setWarranty(updateRequest.getWarranty());
		product.setHsnCode(updateRequest.getHsnCode());
		if (!product.isCompleted())
			product.setCurrentStep(3);
		product.setCompleted(false);
//        System.err.println("backend called with put mapping");
		productRepository.save(product);
	}

	@Override
	public ProductStep3Request getProductDetails(String productId) {
		// System.err.println("In service impl : "+productId);
		// Retrieve the product based on productId
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found with productId: " + productId));

		// System.err.println("In impl : product is : "+product);

		return ProductStep3Request.builder().searchKeywords(product.getSearchKeywords()).tags(product.getTags())
				.manufacturingDetails(product.getManufacturingDetails())
				.productSpecificInfo(product.getProductSpecificInfo()).taxDetails(product.getTaxDetails())
				.warranty(product.getWarranty()).hsnCode(product.getHsnCode()).build();
	}

	@Override
	public int getCurrentStep(String productId) {
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found for ID: " + productId));

		return product.getCurrentStep();
	}

//	@Override
//	public Page<ProductSummaryDTO> getAllProductsByMerchantId(String merchantId, int page, int size) {
//		Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
//		Page<Product> products = productRepository.findByMerchantId(merchantId, pageable);
//		return products.map(product -> new ProductSummaryDTO(product.getProductId(), product.getTitle(),
//				product.getDescription(), product.getProductSpecifications(), product.getBrand(),
//				product.getCurrentStep(), product.isCompleted(), product.getStatus()));
//	}

	@Override
	public Page<ProductSummaryDTO> getAllProductsByMerchantId(String merchantId, int page, int size, String filterName,
			List<String> selectedBrands, List<String> selectedStatuses,List<String>categoryIds) {
		Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

		Page<Product> products = productRepositoryCustom.findFilteredProductsByMerchantId(merchantId, filterName,
				selectedBrands, selectedStatuses,categoryIds, pageable);
		return products.map(product -> new ProductSummaryDTO(product.getProductId(), product.getTitle(),
				product.getDescription(), product.getProductSpecifications(), product.getBrand(),
				product.getCurrentStep(), product.isCompleted(), product.getStatus()));
	}
	
	public Page<ProductSummaryDTO> getFilteredProducts(ProductFilterRequest request) {
	    Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), Sort.by("createdAt").descending());

	    String role = request.getRole();

	    // Only include merchantId filter if role is SELLER
	    String merchantId = "SELLER".equalsIgnoreCase(role) ? request.getMerchantId() : null;

	    // If admin, and you want to restrict by published products
//	    List<String> statuses = request.getSelectedStatuses();
//	    if ("ADMIN".equalsIgnoreCase(role)) {
//	        if (statuses == null || statuses.isEmpty()) {
//	            statuses = List.of("PUBLISHED"); 
//	        }
//	    }

	    Page<Product> products = productRepositoryCustom.findFilteredProductsByMerchantId(
	        merchantId,
	        request.getFilterName(),
	        request.getSelectedBrands(),
	        request.getSelectedStatuses(),
	        request.getCategories(),
	        pageable
	    );

	    return products.map(product -> new ProductSummaryDTO(
	            product.getProductId(),
	            product.getTitle(),
	            product.getDescription(),
	            product.getProductSpecifications(),
	            product.getBrand(),
	            product.getCurrentStep(),
	            product.isCompleted(),
	            product.getStatus()
	    ));
	}


	@Override
	public Product saveProductOnboardingStep6(String productId, Step6RequestPayload request) throws Exception {
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found with productId: " + productId));

		if (request.getShippingDetails() == null) {
			throw new IllegalArgumentException("Shipping details must be provided");
		}

		product.setShippingDetails(request.getShippingDetails());
		product.setCurrentStep(6);

		// Update metadata.updatedAt with current time
		Metadata metadata = product.getMetadata();
		if (metadata == null) {
			metadata = Metadata.builder().build();
		}
		metadata.setUpdatedAt(LocalDateTime.now());
		product.setMetadata(metadata);
		if (!product.isCompleted())
			product.setCurrentStep(6);
		product.setCompleted(true);
		product.setStatus(ProductStatus.PUBLISHED);

		return productRepository.save(product);
	}

	@Override
	public ProductStep6ResponseDTO getStep6Details(String productId) {
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found"));

		ShippingDetails shipping = product.getShippingDetails();
		ProductStep6ResponseDTO.ProductStep6ResponseDTOBuilder builder = ProductStep6ResponseDTO.builder()
				.productId(productId);

		if (shipping != null) {
			builder.dispatchSla(shipping.getDispatchSla()).customDispatchSla(shipping.getCustomDispatchSla())
					.exchangeable(shipping.isExchangeable()).exchangeWindow(shipping.getExchangeWindow())
					.packageDimensions(shipping.getPackageDimensions())
					.packageWeightValue(shipping.getPackageWeightValue())
					.packageWeightUnit(shipping.getPackageWeightUnit()).returnable(shipping.isReturnable())
					.returnWindow(shipping.getReturnWindow());
		}

		return builder.build();
	}

	@Override
	public Product updatePricingStep(String productId, ProductStep4Request request) throws Exception {
		Optional<Product> optionalProduct = productRepository.findByProductId(productId);

		if (!optionalProduct.isPresent()) {
			throw new Exception("Product not found for ID: " + productId);
		}

		Product product = optionalProduct.get();
		int availableStock = request.getAvailableStock();

		Pricing pricing = Pricing.builder().regularPrice(request.getRegularPrice()).availableStock(availableStock)
				.groupBuySlabs(request.getSlabs()).build();

		product.setPricing(pricing);
		if (!product.isCompleted())
			product.setCurrentStep(4);
		product.setCompleted(false);

		return productRepository.save(product);
	}

	@Override
	public List<GroupBuySlab> generateGroupBuyTiers(double basePrice, double discountPercent, int tierCount) {
		List<GroupBuySlab> slabs = new ArrayList<>();

		if (basePrice <= 0) {
			throw new InvalidPricingInputException("Regular price must be greater than 0");
		}

		if (discountPercent < 0) {
			throw new InvalidPricingInputException("Discount percentage cannot be negative");
		}

		if (tierCount < 1 || tierCount > 10) {
			throw new InvalidPricingInputException("Tier count must be between 1 and 10");
		}

		int minQty = 2;

		for (int i = 0; i < tierCount && i < 10; i++) {
			int maxQty = (i == 0) ? 9 : minQty + 9;

			double discount = discountPercent * (i + 1);

			double finalPrice = Math.round((basePrice - (basePrice * discount / 100.0)) * 100.0) / 100.0;

			slabs.add(GroupBuySlab.builder().minQty(minQty).maxQty(maxQty).discountPercentage(discountPercent)
					.finalPrice(finalPrice).build());

			minQty = maxQty + 1;
		}

		return slabs;
	}

	@Override
	public ProductStep4ResponseDTO getProductStep4Details(String productId) {

		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new ResourceNotFoundException("Product not found with productId: " + productId));

		return ProductStep4ResponseDTO.builder().productId(productId)
				.availableStock(product.getPricing().getAvailableStock())
				.regularPrice(product.getPricing().getRegularPrice()).slabs(product.getPricing().getGroupBuySlabs())
				.build();
	}

	@Override
	public Category getCategoryById(String categoryId) {
		Category category = categoryRepository.findById(categoryId).orElse(null);
		if (category == null) {
			throw new ResourceNotFoundException("No category Id found" + categoryId);
		}
		return category;
	}

	@Override
	public Category getCategoryDetails(String productId) {
		String categoryId = getCategoryByProductId(productId);
		Category category = categoryRepository.findById(categoryId).orElse(null);
		if (category == null) {
			throw new ResourceNotFoundException("No category Id found for product" + productId);
		}
		return category;
	}

	@Override
	public String getCategoryByProductId(String productId) {
		System.out.println(productId);
		Optional<Product> optionalProduct = productRepository.findByProductId(productId);

		if (!optionalProduct.isPresent()) {
			throw new ResourceNotFoundException("Product not found for ID: " + productId);
		}
		Product product = optionalProduct.get();

		System.out.println("IN " + product);
		List<CategoryPath> path = product.getCategory().getPath();
		if (path != null && !path.isEmpty()) {
			System.out.println("PATH" + path.get(path.size() - 1).getId());
			return path.get(path.size() - 1).getId();
		}

		throw new ResourceNotFoundException("Category not found for product with ID " + productId);
	}

	@Override
	public List<Product> getAllProducts() {
		return productRepository.findAll();
	}

	@Override
	public Page<Product> getAllPageProducts(Pageable pageable) {
		return productRepository.findAll(pageable);
	}

	public void updateVariantsCount(String productId, Map<String, List<String>> variantsCount) {
		Query query = new Query(Criteria.where("productId").is(productId));
		Update update = new Update().set("variantsSelected", variantsCount).set("currentStep", 5).set("isCompleted",
				false);

		mongoTemplate.updateFirst(query, update, Product.class);
	}

	public Map<String, Object> getVariantsAndDetailsById(String productId) {

		Query query = new Query(Criteria.where("_id").is(getCategoryByProductId(productId)));
		query.fields().include("variants").include("details");

		// Fetch only the fields we want
		Category partialCategory = mongoTemplate.findOne(query, Category.class);

		if (partialCategory == null) {
			return null; // or throw an exception
		}

		Map<String, Object> result = new HashMap<>();
		result.put("variants", partialCategory.getVariants());
		result.put("details", partialCategory.getDetails());

		return result;
	}

	public String getParentIdByProductId(String productId) {
		Product product = productRepository.findByProductId(productId)
				.orElseThrow(() -> new RuntimeException("Product not found with productId: " + productId));

		if (product.getCategory() == null) {
			throw new RuntimeException("Category not found for productId: " + productId);
		}

		return product.getCategory().getParentId();
	}
	
	@Override
	public List<Category> getAllCategoriesWhoseParentIsNull(){
		List<Category> categories=categoryRepository.findByParentIdIsNull();
		return categories;
	}
	

	@Override
	public Category updateCategory(Category request, String categoryId) {
		// Fetch existing category
		Category category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + categoryId));

		category.setName(request.getName());
		category.setSlug(generateSlug(request.getName()));
		category.setLeaf(request.isLeaf());
		category.setAttributes(request.getAttributes());
		category.setSpecificInfo(request.getSpecificInfo());
		category.setMinSlabDiscount(request.getMinSlabDiscount());
		category.setMaxSlabDiscount(request.getMaxSlabDiscount());
		category.setDetails(request.getDetails());
		category.setVariants(request.getVariants());
	
		
		boolean parentChanged = (request.getParentId() != null && !request.getParentId().equals(category.getParentId()))
				|| (request.getParentId() == null && category.getParentId() != null);

		if (parentChanged) {
			if (request.getParentId() != null) {
				Category parent = categoryRepository.findById(request.getParentId())
						.orElseThrow(() -> new ResourceNotFoundException(
								"Parent category not found with ID: " + request.getParentId()));

				category.setParentId(parent.getId());
				category.setLevel(parent.getLevel() + 1);

				List<CategoryPath> path = new ArrayList<>(parent.getPath());
				CategoryPath pathElement = new CategoryPath();
				pathElement.setId(parent.getId());
				pathElement.setName(parent.getName());
				pathElement.setSlug(parent.getSlug());
				path.add(pathElement);
				category.setPath(path);

				if (!path.isEmpty()) {
		            category.setRootId(path.get(0).getId());
		        }
			} else {

				category.setParentId(null);
				category.setLevel(1);
				category.setPath(new ArrayList<>());
				category.setRootId(null);
			}
		}

		return categoryRepository.save(category);

	}
	
	
	@Override
	public Category getCategoryDetailsByCategoryId(String categoryId) {
		Category category = categoryRepository.findById(categoryId)
				.orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + categoryId));
		return category;
	}

	@Override
	public List<Category> getAllCategories() {
		return categoryRepository.findAll();
	}
}
