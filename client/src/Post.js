import { format } from "date-fns";
import {Link} from "react-router-dom";

export default function Post({
  title,
  summary,
  cover,
  content,
  createdAt,
  author,
  _id
}) {
  const imgSrc = "http://localhost:4000/" + cover;
  return (
    <div className="post">
      <Link to={`/post/${_id}`}>
        <div className="image">
          <img src={imgSrc} alt="" />
        </div>
      </Link>
      <div className="texts">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          <a href="/" className="author">
            {author.username}
          </a>
          <time>{format(new Date(createdAt), "MM-d-yyyy HH:mm")}</time>
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}
