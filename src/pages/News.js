import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Paper,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  query, 
  getDocs, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../services/AuthContext';

function News() {
  const { currentUser, userRole, isAdmin, userProfile } = useAuth();
  const [news, setNews] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    category: '',
    priority: 'normal',
    schoolCode: userProfile?.schoolCode || '',
    targetUserTypes: ['student', 'teacher', 'parent']
  });

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      const newsRef = collection(db, 'news');
      let newsQuery;
      
      if (isAdmin) {
        // Admins can see all news
        newsQuery = query(newsRef, orderBy('timestamp', 'desc'));
      } else {
        // Non-admins only see news for their school
        newsQuery = query(
          newsRef,
          where('schoolCode', '==', userProfile.schoolCode),
          orderBy('timestamp', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(newsQuery);
      const newsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString() || new Date().toLocaleString()
      }));
      setNews(newsData);
    } catch (error) {
      setError('Error fetching news: ' + error.message);
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userProfile?.schoolCode]);

  useEffect(() => {
    if (userProfile?.schoolCode) {
      fetchNews();
    }
  }, [userProfile?.schoolCode, fetchNews]);

  const handleImageUpload = async (file) => {
    if (!file) return null;
    try {
      const storageRef = ref(storage, `news-images/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (error) {
      throw new Error('Error uploading image: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to post news');
      return;
    }
    
    if (!userProfile?.schoolCode) {
      setError('School code is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let imageUrl = formData.imageUrl;
      if (selectedImage) {
        imageUrl = await handleImageUpload(selectedImage);
      }

      const newsData = {
        ...formData,
        imageUrl,
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
        author: currentUser.email,
        authorId: currentUser.uid,
        schoolCode: userProfile.schoolCode,
        authorRole: userRole
      };

      if (selectedNews) {
        // Check if user has permission to edit
        if (!isAdmin && selectedNews.authorId !== currentUser.uid) {
          throw new Error('You do not have permission to edit this news item');
        }
        await updateDoc(doc(db, 'news', selectedNews.id), newsData);
      } else {
        await addDoc(collection(db, 'news'), newsData);
      }
      
      handleClose();
      fetchNews();
    } catch (error) {
      setError('Error saving news: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!currentUser) {
      setError('You must be logged in to delete news');
      return;
    }

    const newsDoc = await getDoc(doc(db, 'news', id));
    if (!newsDoc.exists()) {
      setError('News item not found');
      return;
    }

    // Check permissions
    if (!isAdmin && newsDoc.data().authorId !== currentUser.uid) {
      setError('You do not have permission to delete this news item');
      return;
    }

    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, 'news', id));
        fetchNews();
      } catch (error) {
        setError('Error deleting news: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpen = (newsItem = null) => {
    if (newsItem) {
      setSelectedNews(newsItem);
      setFormData({
        title: newsItem.title || '',
        content: newsItem.content || '',
        imageUrl: newsItem.imageUrl || '',
        category: newsItem.category || '',
        priority: newsItem.priority || 'normal',
        schoolCode: newsItem.schoolCode || '',
        targetUserTypes: newsItem.targetUserTypes || ['student', 'teacher', 'parent']
      });
    } else {
      setSelectedNews(null);
      setFormData({
        title: '',
        content: '',
        imageUrl: '',
        category: '',
        priority: 'normal',
        schoolCode: userProfile?.schoolCode || '',
        targetUserTypes: ['student', 'teacher', 'parent']
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedNews(null);
    setSelectedImage(null);
    setError(null);
    setFormData({
      title: '',
      content: '',
      imageUrl: '',
      category: '',
      priority: 'normal',
      schoolCode: userProfile?.schoolCode || '',
      targetUserTypes: ['student', 'teacher', 'parent']
    });
  };

  const canEdit = (newsItem) => {
    if (!currentUser) return false;
    return isAdmin || newsItem?.authorId === currentUser.uid;
  };

  const columns = [
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'category', headerName: 'Category', width: 130 },
    { field: 'priority', headerName: 'Priority', width: 100 },
    { field: 'timestamp', headerName: 'Date', width: 180 },
    { field: 'author', headerName: 'Author', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Box>
          {canEdit(params.row) && (
            <>
              <IconButton
                size="small"
                onClick={() => handleOpen(params.row)}
                color="primary"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(params.row.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">News Management</Typography>
        <Box>
          {userRole && (
            <Button
              variant="contained"
              onClick={() => handleOpen()}
              startIcon={<AddIcon />}
              disabled={!userProfile?.schoolCode}
            >
              Add News
            </Button>
          )}
        </Box>
      </Box>

      {!userProfile?.schoolCode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please set up your school code in your profile to manage news.
        </Alert>
      )}

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={news}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5]}
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{selectedNews ? 'Edit News' : 'Add News'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
              error={!formData.title}
              helperText={!formData.title && "Title is required"}
            />
            <TextField
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              margin="normal"
            />
            <TextField
              select
              fullWidth
              label="Priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              margin="normal"
            >
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="School Code"
              value={formData.schoolCode}
              onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
              margin="normal"
              required
              error={!formData.schoolCode}
              helperText={!formData.schoolCode && "School code is required"}
            />
            <TextField
              fullWidth
              label="Content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              margin="normal"
              required
              multiline
              rows={4}
              error={!formData.content}
              helperText={!formData.content && "Content is required"}
            />
            <input
              accept="image/*"
              type="file"
              onChange={(e) => setSelectedImage(e.target.files[0])}
              style={{ marginTop: 16 }}
            />
            {loading && <CircularProgress sx={{ mt: 2 }} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading || !formData.title || !formData.content || !formData.schoolCode}
          >
            {selectedNews ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default News;
