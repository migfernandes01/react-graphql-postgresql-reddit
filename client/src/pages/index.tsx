import { withUrqlClient } from "next-urql";
import { NavBar } from "../components/NavBar";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  // hook for posts query
  const [{data}] = usePostsQuery();

  return (
    <>
      <NavBar />
      <div color="white">Hello world</div>
      <br />
      {!data ? <p>Loading...</p> : data.posts.map((post) => (
        <div key={post.id}>{post.title}</div>
      ))}
    </>
  );
  
};

// use URQL client in this component using server side rendering
export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
