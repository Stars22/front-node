const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String
        status: String!
        posts: [Post]!
    }

    type authData {
        token: String!
        userId: String!
    }

    type PostData {
        posts(page: Int): [Post!]!
        totalPosts: Int!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String
    }

    input PostInputData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData!): User!
        createPost(postInput: PostInputData!): Post!
    }

    type RootQuery {
        posts: PostData
        login(email: String!, password: String!): authData!
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);