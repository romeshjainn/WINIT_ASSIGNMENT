import type {
  CourseDetail,
  CourseInstructor,
  CourseListItem,
  CoursePage,
  ListQueryParams,
  RawPaginatedList,
  RawProduct,
  RawProductListItem,
  RawRandomUser,
} from '@/types/course.types';
import type { ApiResponse } from '../api-client';
import apiClient from '../api-client';

const ENDPOINTS = {
  RANDOM_USERS: '/public/randomusers',
  RANDOM_PRODUCTS: '/public/randomproducts',
} as const;

const DEFAULT_USER_LIMIT = 10;
const DEFAULT_PRODUCT_LIMIT = 10;

async function fetchUsers(params: ListQueryParams = {}): Promise<RawRandomUser[]> {
  const response = await apiClient.get<ApiResponse<RawPaginatedList<RawRandomUser>>>(
    ENDPOINTS.RANDOM_USERS,
    {
      params: {
        limit: params.limit ?? DEFAULT_USER_LIMIT,
        ...(params.page !== undefined && { page: params.page }),
      },
    },
  );
  return response.data.data.data;
}

async function fetchProductsPage(params: ListQueryParams = {}): Promise<{
  items: RawProductListItem[];
  meta: { page: number; totalPages: number; totalItems: number; hasNextPage: boolean };
}> {
  const response = await apiClient.get<ApiResponse<RawPaginatedList<RawProductListItem>>>(
    ENDPOINTS.RANDOM_PRODUCTS,
    {
      params: {
        limit: params.limit ?? DEFAULT_PRODUCT_LIMIT,
        ...(params.page !== undefined && { page: params.page }),
        ...(params.query && { query: params.query }),
        ...(params.sortBy && { sortBy: params.sortBy }),
        ...(params.sortType && { sortType: params.sortType }),
      },
    },
  );
  const d = response.data.data;
  return {
    items: d.data,
    meta: {
      page: d.page,
      totalPages: d.totalPages,
      totalItems: d.totalItems,
      hasNextPage: d.nextPage,
    },
  };
}

async function fetchProduct(courseId: number): Promise<RawProduct> {
  const response = await apiClient.get<ApiResponse<RawProduct>>(
    `${ENDPOINTS.RANDOM_PRODUCTS}/${courseId}`,
  );
  return response.data.data;
}

function mapInstructor(user: RawRandomUser): CourseInstructor {
  return {
    id: user.id,
    name: `${user.name.first} ${user.name.last}`,
    avatarUrl: user.picture.medium,
    location: `${user.location.city}, ${user.location.country}`,
    email: user.email,
  };
}

function mapCourseListItem(
  product: RawProductListItem,
  instructor: CourseInstructor,
): CourseListItem {
  return {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    images: product.images,
    price: product.price,
    category: product.category,
    instructor,
  };
}

function mapCourseDetail(product: RawProduct, instructor: CourseInstructor): CourseDetail {
  return {
    id: product.id,
    title: product.title,
    thumbnail: product.thumbnail,
    images: product.images,
    price: product.price,
    category: product.category,
    description: product.description,
    brand: product.brand,
    rating: product.rating,
    stock: product.stock,
    discountPercentage: product.discountPercentage,
    instructor,
  };
}

function placeholderInstructor(): CourseInstructor {
  return {
    id: 0,
    name: 'Unknown Instructor',
    avatarUrl: '',
    location: '',
    email: '',
  };
}

async function getCourses(params?: ListQueryParams): Promise<CourseListItem[]> {
  const [{ items: products }, users] = await Promise.all([fetchProductsPage(params), fetchUsers()]);

  const instructorPool = users.length > 0 ? users : [];

  return products.map((product, index) => {
    const user = instructorPool[index % Math.max(instructorPool.length, 1)];
    const instructor = user ? mapInstructor(user) : placeholderInstructor();
    return mapCourseListItem(product, instructor);
  });
}

async function getCourseDetail(courseId: number): Promise<CourseDetail> {
  const [product, users] = await Promise.all([fetchProduct(courseId), fetchUsers()]);

  const instructor =
    users.length > 0 ? mapInstructor(users[courseId % users.length]) : placeholderInstructor();

  return mapCourseDetail(product, instructor);
}

async function getCoursesPage(params: ListQueryParams = {}): Promise<CoursePage> {
  const [{ items: products, meta }, users] = await Promise.all([
    fetchProductsPage(params),
    fetchUsers(),
  ]);

  const instructorPool = users.length > 0 ? users : [];

  const courses = products.map((product, index) => {
    const user = instructorPool[index % Math.max(instructorPool.length, 1)];
    const instructor = user ? mapInstructor(user) : placeholderInstructor();
    return mapCourseListItem(product, instructor);
  });

  return {
    courses,
    page: meta.page,
    totalPages: meta.totalPages,
    totalItems: meta.totalItems,
    hasNextPage: meta.hasNextPage,
  };
}

export const courseService = {
  getCourses,
  getCourseDetail,
  getCoursesPage,
};
