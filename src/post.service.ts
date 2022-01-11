import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  User,
  Post,
  Prisma,
} from '@prisma/client';
import { userInfo } from 'os';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async post(postWhereUniqueInput: Prisma.PostWhereUniqueInput): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: postWhereUniqueInput,
    });
  }

  async posts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({
      data,
    });
  }

  async awardPoints(userId: number, addPoints: number): Promise<User> {
    const user = await this.prisma.user.findUnique({where: {id: userId}});
    const newPoints = user.points + addPoints;
    console.log(newPoints)
    return this.prisma.user.update({
        data: {points: newPoints},
        where: {id: userId}
    })
  }

  async publishPost(where: Prisma.PostWhereUniqueInput, data: Prisma.PostUpdateInput): Promise<Post> {
    const post =  await this.prisma.post.findUnique({where: {id: where.id}});
    if (post.published) {
        return this.prisma.post.findUnique({where: {id: where.id}});
    }
    const timeLeft = post.deadline.getTime() - Date.now();
    const totalTime = post.deadline.getTime() - post.createTime.getTime();
    const pointsWon = Math.abs(timeLeft/totalTime).toFixed(2);
    await this.awardPoints(post.authorId, Number(pointsWon));
    return this.prisma.post.update({
        data,
        where
    })
  }

  async updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    const { data, where } = params;
    console.log(data);
    if (data.published) {
        return this.publishPost(where, data);
    }
    return this.prisma.post.update({
      data,
      where,
    });
  }

  async deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({
      where,
    });
  }
}